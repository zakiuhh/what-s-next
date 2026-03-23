import { SYSTEM_PROMPT, buildPrompt } from './suggest.js';

const PROVIDERS = {
  anthropic: {
    label: 'Claude (Anthropic)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    type: 'anthropic'
  },
  groq: {
    label: 'Groq (BYO key)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    type: 'openai-compat'
  },
  kimi: {
    label: 'Kimi (Moonshot AI)',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    type: 'openai-compat'
  },
  mistral: {
    label: 'Mistral AI',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    type: 'openai-compat'
  }
};

async function callOpenAICompat(apiKey, userInput, provider, modelOverride) {
  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelOverride || provider.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(userInput) }
      ],
      temperature: 0.7,
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `${provider.label} error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return safeParseModelOutput(text);
}

async function callAnthropic(apiKey, userInput, modelOverride) {
  const response = await fetch(PROVIDERS.anthropic.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: modelOverride || PROVIDERS.anthropic.model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(userInput) }],
      max_tokens: 1200
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  return safeParseModelOutput(text);
}

function safeParseModelOutput(text) {
  const cleaned = String(text).replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const sub = cleaned.slice(first, last + 1);
      try { return JSON.parse(sub); } catch (e) { /* fall through */ }
    }
    throw new Error('Failed to parse model JSON response: ' + (err.message || err) + ' — raw response (truncated): ' + cleaned.slice(0,1000));
  }
}

async function callByok(apiKey, userInput, providerId, modelOverride) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (providerId === 'anthropic') return callAnthropic(apiKey, userInput, modelOverride);
  return callOpenAICompat(apiKey, userInput, provider, modelOverride);
}

async function fetchModels(apiKey, providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  try {
    let url;
    let headers = { 'Content-Type': 'application/json' };

    if (provider.type === 'anthropic') {
      url = 'https://api.anthropic.com/v1/models';
      headers['x-api-key'] = apiKey;
    } else {
      const base = provider.endpoint.split('/v1')[0];
      url = base + '/v1/models';
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
    const data = await res.json().catch(() => ({}));

    let ids = [];
    if (Array.isArray(data.data)) ids = data.data.map(d => d.id || d.name).filter(Boolean);
    else if (Array.isArray(data.models)) ids = data.models.map(m => m.id || m.name).filter(Boolean);
    else if (Array.isArray(data)) ids = data.map(d => d.id || d.name).filter(Boolean);

    if (!ids.length) throw new Error('No models returned');
    return ids.map(id => ({ id, label: id }));
  } catch (err) {
    // fallback to provider default model
    return [{ id: provider.model, label: provider.model }];
  }
}

export { callByok, PROVIDERS, fetchModels };
