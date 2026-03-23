import { SYSTEM_PROMPT, buildPrompt } from './suggest.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
// Default to Groq's compound model (recommended replacement for older llama3 models)
const GROQ_MODEL = 'groq/compound';

async function callGroq(groqApiKey, userInput, modelOverride) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    },
    body: JSON.stringify({
      model: modelOverride || GROQ_MODEL,
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
    throw new Error(err?.error?.message || `Groq error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
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

export { callGroq };
