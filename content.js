// Extracts the main readable text from the page.
// Prefers <article>, <main>, or falls back to <body>.
// Returns { text, wordCount }
(function extractContent() {
  const candidate = document.querySelector('article') ||
                    document.querySelector('main') ||
                    document.querySelector('[role="main"]') ||
                    document.body;

  // Clone to avoid mutating the page
  const clone = candidate.cloneNode(true);

  // Remove noisy elements
  ['nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript',
   '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
   '.sidebar', '#sidebar', '.nav', '.menu', '.ad', '.advertisement'
  ].forEach(sel => {
    try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch {}
  });

  const text = (clone.innerText || clone.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000); // cap to avoid huge prompts

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return { text, wordCount };
})();
