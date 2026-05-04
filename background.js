// Proxy URL — update this to your deployed Next.js URL in production
const API_URL = 'https://summarizer-api-sandy.vercel.app/api/summarize';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'SUMMARIZE') return;

  (async () => {
    try {
      // Check cache first
      const cached = await chrome.storage.local.get(msg.url);
      if (cached[msg.url]) return sendResponse(cached[msg.url]);

      // Extract page content via scripting API
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: msg.tabId },
        func: () => {
          const candidate =
            document.querySelector('article') ||
            document.querySelector('main') ||
            document.querySelector('[role="main"]') ||
            document.body;
          const clone = candidate.cloneNode(true);
          ['nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript'].forEach(tag => {
            clone.querySelectorAll(tag).forEach(el => el.remove());
          });
          const text = (clone.innerText || clone.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 15000);
          const wordCount = text.split(/\s+/).filter(Boolean).length;
          return { text, wordCount };
        },
      });

      if (!result?.text) return sendResponse({ error: 'Could not extract page content.' });

      const readingMins = Math.max(1, Math.round(result.wordCount / 200));
      const readingTime = `${readingMins} min read`;

      // Call the Next.js proxy — API key stays on the server
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result.text, brief: msg.brief }),
      });

      const data = await res.json();
      if (!res.ok) return sendResponse({ error: data.error || `Server error ${res.status}` });

      const summary = {
        bullets: data.bullets || [],
        insights: data.insights || [],
        readingTime,
        wordCount: result.wordCount,
      };

      await chrome.storage.local.set({ [msg.url]: summary });
      sendResponse(summary);
    } catch (e) {
      sendResponse({ error: (e instanceof Error ? e.message : null) || 'Unexpected error.' });
    }
  })();

  return true; // keep channel open for async response
});
