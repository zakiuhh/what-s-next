# What's Next?

> An AI-powered advisor that maps out your next career move, courses, projects, and reads — based on what you just finished.

---

## Overview

**What's Next?** is a lightweight, browser-based tool that takes a single sentence about something you just completed — a degree, a bootcamp, a job, a certification, a project — and generates a structured, personalized roadmap of what to do next across four categories: career moves, courses to take, projects to build, and books to read.

No backend. No account. No data collection. Everything runs in your browser.

---

## Demo

<img width="1294" height="940" alt="image" src="https://github.com/user-attachments/assets/242520dc-aac0-47da-a9f1-acfbf3fcf61e" />


Type something like:

- *"I just finished my BSc in Computer Science"*
- *"I completed a Python bootcamp"*
- *"I wrapped up two years of freelancing in web development"*
- *"I finished the Google UX Design certificate"*

And get back 12 tailored, specific suggestions organized into tabs.

---

## Features

- **Four suggestion categories** - Career moves, Courses to take, Projects to build, Books to read
- **Multi-provider support** - Works with Groq (free), Claude (Anthropic), Kimi (Moonshot AI), and Mistral AI
- **Dynamic model selection** - Fetches available models from the provider's API live
- **BYOK (Bring Your Own Key)** - Your API key is saved only in your browser's `localStorage`, never sent to any server other than the AI provider
- **Fully offline-capable UI** - No server, no build step, no framework
- **Responsive design** - Works on mobile and desktop
- **Character counter** - 300-character limit on input to keep prompts focused
- **Animated result cards** - Staggered card entrance animations per tab

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, keyframe animations) |
| Logic | Vanilla JavaScript (ES Modules) |
| Fonts | Google Fonts — Instrument Serif, DM Mono, Manrope |
| AI | Groq API (default), Anthropic, Mistral, Moonshot AI |

No frameworks. No bundlers. No dependencies. Just files.

---

## File Structure

```
whats-next/
├── index.html       # App shell and layout
├── style.css        # All styles — dark theme, typography, animations
├── app.js           # Main logic — form handling, rendering, settings, tabs
├── groq.js          # Groq API integration
├── byok.js          # Multi-provider API integration + model fetching
└── suggest.js       # System prompt and user prompt builder
```

---

## Getting Started

### 1. Get a Free Groq API Key

Groq offers a **completely free** API tier with generous rate limits — no credit card required.

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to **API Keys** from the sidebar
4. Click **Create API Key**
5. Copy the key (it starts with `gsk_...`)

### 2. Run the App

Since this is plain HTML/CSS/JS with ES Modules, you need to serve it over HTTP (not open `index.html` directly as a `file://` URL, because browsers block ES Module imports over `file://`).

**Option A — VS Code Live Server**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and click **Open with Live Server**.

**Option B — Python (no install needed)**

```bash
# Python 3
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

**Option C — Node.js**

```bash
npx serve .
```

### 3. Add Your Key

1. Click **settings ↓** at the bottom of the input section
2. Paste your Groq key into the **Groq API Key** field
3. The key is saved automatically to `localStorage`

### 4. Use It

Type what you just finished into the text area and hit **what's next →**.

---

## Settings Panel

| Setting | Description |
|---|---|
| **Groq API Key** | Your free Groq key (`gsk_...`). Used when provider is set to Groq. |
| **Provider** | Choose between Groq, Claude (Anthropic), Kimi, or Mistral |
| **Model** | Populated automatically from the provider's model list. Select any available model. |
| **Your API Key** | If using a non-Groq provider, paste that provider's key here |

Keys are stored in `localStorage` under prefixed keys (`wn_groq_key`, `wn_byok_key`, `wn_provider`, `wn_model`). They are never transmitted anywhere except directly to the chosen AI provider's official API endpoint.

---

## Supported Providers

| Provider | Free Tier | Endpoint |
|---|---|---|
| [Groq](https://console.groq.com) | ✅ Yes | `api.groq.com` |
| [Anthropic (Claude)](https://console.anthropic.com) | ❌ Paid | `api.anthropic.com` |
| [Kimi (Moonshot AI)](https://platform.moonshot.cn) | Limited free | `api.moonshot.cn` |
| [Mistral AI](https://console.mistral.ai) | Limited free | `api.mistral.ai` |

**Groq is recommended** for most users — it's free, fast, and requires no payment method to get started.

---

## How It Works

1. You type what you just finished
2. The app sends a structured prompt to the selected AI provider
3. The AI responds with a strict JSON object containing a summary and 3 items per category (career, courses, projects, books)
4. The app parses the JSON and renders it as animated cards organized by tabs

The prompt and JSON schema live in `suggest.js` and are shared across all provider integrations.

---

## Privacy

- No analytics, no tracking, no external requests except to the AI provider you explicitly configure
- API keys are stored locally in your browser using `localStorage` and never leave your device except when sent to your chosen provider's official API
- No backend server — the app is entirely static

---

## License

MIT — do whatever you want with it.
