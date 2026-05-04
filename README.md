# AI Page Summarizer — Chrome Extension

A Manifest V3 Chrome Extension that extracts content from any webpage and returns a structured AI-generated summary using Google Gemini.

---

## Features

- Bullet-point summary + key insights
- Estimated reading time and word count
- 3-bullet brief mode
- Per-URL caching (no duplicate API calls)
- Dark/light mode toggle
- Copy summary to clipboard
- Clean, accessible popup UI

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/summarizer-extension.git
cd summarizer-extension
```

### 2. Load the Extension

**Option A: Load Unpacked (Development)**

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `summarizer-extension` folder

**Option B: Install via .crx file**

First, pack the extension to generate the `.crx`:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Pack extension** → set the root directory to the `summarizer-extension` folder
4. Chrome generates `summarizer-extension.crx` in the parent folder

Then install it:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Drag and drop `summarizer-extension.crx` onto the page

> Chrome may show a warning about installing extensions outside the Web Store — click **Add extension** to proceed.

---

## Setup Instructions

### 1. Deploy the API (summarizer-api)

The extension uses a Next.js proxy server to keep the API key off the client.

1. Clone the `summarizer-api` repo and push it to GitHub
2. Deploy to [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` in **Vercel → Settings → Environment Variables**
4. Redeploy — note your deployed URL (e.g. `https://summarizer-api.vercel.app`)

### 2. Configure the Extension

In `background.js`, set `API_URL` to your deployed API:

```js
const API_URL = 'https://your-api.vercel.app/api/summarize';
```

### 3. Load the Extension

Follow **Option A** or **Option B** above.

---

## Architecture

```
popup.html / popup.js        — UI, user interaction, renders summary
        |
        | chrome.runtime.sendMessage
        ↓
background.js (service worker) — receives message, checks cache,
        |                        calls proxy API, stores result
        | fetch
        ↓
summarizer-api (Next.js/Vercel) — receives text, calls Gemini API,
                                   returns structured JSON
content.js                     — injected to extract page text
                                 (clones DOM, strips noise, returns text)
```

---

## AI Integration

- **Provider:** Google Gemini (`gemini-1.5-flash`)
- **Flow:** Popup → background service worker → Next.js proxy → Gemini API → response back to popup
- **Prompt:** Instructs Gemini to return JSON with `bullets` and `insights` arrays
- **Brief mode:** Sends a flag to the proxy which adjusts the prompt to return only 3 bullets

---

## Security Decisions

- **API key never touches the extension** — all AI calls go through a server-side proxy (Next.js API route on Vercel). The key lives only in Vercel's environment variables.
- **No secrets in source code** — `.env.local` is gitignored in both repos
- **Minimal permissions** — only `activeTab`, `storage`, and `scripting` (no broad host access beyond what's needed)
- **Content sanitization** — summary text is set via `textContent`, never `innerHTML`, preventing XSS

---

## Trade-offs

| Decision | Reason |
|---|---|
| Proxy server instead of direct API call | Keeps API key secure; adds one network hop |
| `activeTab` over broad host permissions | Least-privilege; only accesses the tab the user is on |
| DOM cloning for content extraction | Avoids mutating the live page; safe and side-effect free |
| `chrome.storage.local` for caching | Avoids redundant API calls; persists across popup opens |
| Gemini Flash model | Fast and cost-effective for summarisation tasks |
