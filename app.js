import { callGroq } from './groq.js';
import { callByok, PROVIDERS, fetchModels } from './byok.js';

const STORAGE_KEYS = {
  GROQ_KEY:  'wn_groq_key',
  BYOK_KEY:  'wn_byok_key',
  PROVIDER:  'wn_provider',
  MODEL:     'wn_model'
};

const CATEGORY_META = {
  career:   { label: 'Career moves',    icon: '◈' },
  courses:  { label: 'Courses to take', icon: '◉' },
  projects: { label: 'Projects to build', icon: '◆' },
  books:    { label: 'Books to read',   icon: '◇' },
  youtube:  { label: 'YouTube courses', icon: '▶' },
  pathways: { label: 'Pathways',        icon: '▣' }
};

let activeCategory = 'career';
let currentResults = null;

const form           = document.getElementById('main-form');
const input          = document.getElementById('user-input');
const submitBtn      = document.getElementById('submit-btn');
const resultsArea    = document.getElementById('results');
const summaryEl      = document.getElementById('summary');
const tabsEl         = document.getElementById('tabs');
const cardsEl        = document.getElementById('cards');
const errorEl        = document.getElementById('error');
const groqKeyInput   = document.getElementById('groq-key');
const byokInput      = document.getElementById('byok-key');
const providerSelect = document.getElementById('provider-select');
const modelSelect    = document.getElementById('model-select');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel  = document.getElementById('settings-panel');
const charCount      = document.getElementById('char-count');

// Populate provider dropdown and restore saved values
window.addEventListener('DOMContentLoaded', () => {
  Object.entries(PROVIDERS).forEach(([id, p]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = p.label;
    providerSelect.appendChild(opt);
  });

  groqKeyInput.value   = localStorage.getItem(STORAGE_KEYS.GROQ_KEY) || '';
  byokInput.value      = localStorage.getItem(STORAGE_KEYS.BYOK_KEY) || '';
  providerSelect.value = localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'anthropic';

  updateModels();
  const savedModel = localStorage.getItem(STORAGE_KEYS.MODEL);
  if (savedModel && modelSelect) modelSelect.value = savedModel;

  // Ensure settings toggle works by binding after DOM is ready
  const toggleBtn = document.getElementById('settings-toggle');
  if (toggleBtn) {
    // avoid double-binding
    if (!toggleBtn._wnBound) {
      toggleBtn.addEventListener('click', (e) => { e.preventDefault(); toggleSettingsPanel(); });
      toggleBtn._wnBound = true;
    }
  }
});

settingsToggle.addEventListener('click', () => {
  if (!settingsPanel) return;
  const isOpen = settingsPanel.classList.toggle('open');
  settingsToggle.textContent = isOpen ? 'close settings ↑' : 'settings ↓';
  settingsToggle.setAttribute('aria-expanded', String(isOpen));
});

groqKeyInput.addEventListener('change', () =>
  localStorage.setItem(STORAGE_KEYS.GROQ_KEY, groqKeyInput.value.trim()));

byokInput.addEventListener('change', () => {
  localStorage.setItem(STORAGE_KEYS.BYOK_KEY, byokInput.value.trim());
  updateModels();
});

providerSelect.addEventListener('change', () => {
  localStorage.setItem(STORAGE_KEYS.PROVIDER, providerSelect.value);
  updateModels();
});

if (modelSelect) {
  modelSelect.addEventListener('change', () =>
    localStorage.setItem(STORAGE_KEYS.MODEL, modelSelect.value));
}

input.addEventListener('input', () => {
  charCount.textContent = `${input.value.length}/300`;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  setLoading(true);
  hideError();
  hideResults();

  try {
    const results = await fetchSuggestions(text);
    currentResults = results;
    renderResults(results);
  } catch (err) {
    showError(err.message || String(err));
  } finally {
    setLoading(false);
  }
});

async function fetchSuggestions(text) {
  const groq     = groqKeyInput.value.trim();
  const byok     = byokInput.value.trim();
  const provider = providerSelect.value;
  const model    = modelSelect?.value;

  if (groq && provider === 'groq') return callGroq(groq, text, model);
  if (byok) return callByok(byok, text, provider, model);
  if (groq) return callGroq(groq, text, model);

  throw new Error('No API key set. Add a Groq key (free) or your own key in settings.');
}

function buildTabs() {
  tabsEl.innerHTML = '';
  Object.entries(CATEGORY_META).forEach(([key, meta]) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (key === activeCategory ? ' active' : '');
    btn.dataset.category = key;
    btn.innerHTML = `<span class="tab-icon">${meta.icon}</span>${meta.label}`;
    btn.addEventListener('click', () => {
      activeCategory = key;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderCards(currentResults?.[key]);
    });
    tabsEl.appendChild(btn);
  });
}

function renderCards(items) {
  cardsEl.innerHTML = '';
  if (!items || !items.length) {
    cardsEl.innerHTML = '<p class="empty">No suggestions for this category.</p>';
    return;
  }
  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${i * 60}ms`;
    // Build link or wiki display when present
    let extra = '';
    if (item.link) {
      const safe = String(item.link).replace(/"/g, '&quot;');
      extra = `<p class="card-link"><a href="${safe}" target="_blank" rel="noopener">Open link</a></p>`;
    } else if (item.wiki) {
      // show wiki-style link text
      const wikiText = String(item.wiki);
      extra = `<p class="card-wiki">${wikiText}</p>`;
    }

    card.innerHTML = `
      <span class="card-num">0${i + 1}</span>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-desc">${item.desc}</p>
      ${extra}
    `;
    cardsEl.appendChild(card);
  });
}

function renderResults(data) {
  summaryEl.textContent = data.summary || '';
  buildTabs();
  renderCards(data[activeCategory]);
  resultsArea.classList.remove('hidden');
  resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? 'thinking...' : "what's next →";
  input.disabled = on;
}

async function updateModels() {
  if (!modelSelect) return;
  const provider = providerSelect.value;
  const apiKey = byokInput.value.trim();
  modelSelect.innerHTML = '';
  const loadingOpt = document.createElement('option');
  loadingOpt.textContent = 'Loading models...';
  modelSelect.appendChild(loadingOpt);
  try {
    const models = await fetchModels(apiKey, provider);
    // If provider is Groq, include known Groq model options as well
    const extraGroq = provider === 'groq' ? ['groq/compound', 'groq/compound-mini'] : [];
    const merged = [];
    extraGroq.forEach(id => merged.push({ id, label: id }));
    models.forEach(m => {
      if (!merged.some(x => x.id === m.id)) merged.push(m);
    });
    modelSelect.innerHTML = '';
    merged.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.label;
      modelSelect.appendChild(o);
    });
    const saved = localStorage.getItem(STORAGE_KEYS.MODEL);
    if (saved && Array.from(modelSelect.options).some(o => o.value === saved)) modelSelect.value = saved;
    else if (modelSelect.options.length) modelSelect.value = modelSelect.options[0].value;
    localStorage.setItem(STORAGE_KEYS.MODEL, modelSelect.value);
  } catch (err) {
      // fallback: show provider default and common Groq options for Groq
      modelSelect.innerHTML = '';
      const def = PROVIDERS[provider]?.model || '';
      const baseList = [{ id: def, label: def }];
      if (provider === 'groq') baseList.push({ id: 'groq/compound', label: 'groq/compound' }, { id: 'groq/compound-mini', label: 'groq/compound-mini' });
      baseList.forEach(m => {
        const o = document.createElement('option'); o.value = m.id; o.textContent = m.label; modelSelect.appendChild(o);
      });
      localStorage.setItem(STORAGE_KEYS.MODEL, modelSelect.value || def);
  }
}

function hideResults() { resultsArea.classList.add('hidden'); }
function hideError()   { errorEl.classList.add('hidden'); errorEl.textContent = ''; }
function showError(msg){ errorEl.textContent = `⚠ ${msg}`; errorEl.classList.remove('hidden'); }

// Robust settings toggle: use event delegation in case initial element refs were null
function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const toggle = document.getElementById('settings-toggle');
  if (!panel || !toggle) return;
  const isOpen = panel.classList.toggle('open');
  toggle.textContent = isOpen ? 'close settings ↑' : 'settings ↓';
  toggle.setAttribute('aria-expanded', String(isOpen));
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('#settings-toggle');
  if (btn) toggleSettingsPanel();
});

// Show uncaught errors in the UI to help debugging
window.addEventListener('error', (ev) => {
  try { showError(ev.message || String(ev)); } catch (e) { /* ignore */ }
});
window.addEventListener('unhandledrejection', (ev) => {
  try { showError(ev.reason?.message || JSON.stringify(ev.reason) || 'Unhandled promise rejection'); } catch (e) { /* ignore */ }
});
