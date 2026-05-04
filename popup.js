const $ = id => document.getElementById(id);

// --- Theme ---
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  $('iconMoon').hidden = dark;
  $('iconSun').hidden = !dark;
}

chrome.storage.local.get('darkMode', ({ darkMode }) => applyTheme(!!darkMode));

$('themeToggle').addEventListener('click', () => {
  const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
  applyTheme(dark);
  chrome.storage.local.set({ darkMode: dark });
});

// --- Page title ---
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.title) $('pageTitle').textContent = tab.title;
});

// --- State helpers ---
function setLoading(on) {
  $('spinner').hidden = !on;
  $('summarizeBtn').disabled = on;
  $('status').hidden = true;
}

function showError(msg) {
  $('status').textContent = msg;
  $('status').hidden = false;
}

function renderSummary({ bullets, insights, readingTime, wordCount }) {
  const render = (listEl, items) => {
    listEl.innerHTML = '';
    (items || []).forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  };
  render($('summaryList'), bullets);
  render($('insightsList'), insights);
  $('readingTime').textContent = readingTime ? `⏱ ${readingTime}` : '';
  $('wordCount').textContent = wordCount ? `${wordCount.toLocaleString()} words` : '';
  $('output').hidden = false;
  $('clearBtn').disabled = false;
}

// --- Load cached summary for current tab ---
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) return;
  chrome.storage.local.get(tab.url, result => {
    if (result[tab.url]) renderSummary(result[tab.url]);
  });
});

// --- Summarize ---
$('summarizeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return showError('Cannot access this tab.');

  const brief = $('briefMode').checked;

  setLoading(true);
  $('output').hidden = true;

  chrome.runtime.sendMessage({ type: 'SUMMARIZE', tabId: tab.id, url: tab.url, brief }, response => {
    setLoading(false);
    if (chrome.runtime.lastError) return showError('Extension error. Try reloading.');
    if (response?.error) return showError(response.error);
    renderSummary(response);
  });
});

// --- Clear ---
$('clearBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) chrome.storage.local.remove(tab.url);
  $('output').hidden = true;
  $('clearBtn').disabled = true;
  $('status').hidden = true;
});

// --- Copy ---
$('copyBtn').addEventListener('click', () => {
  const bullets = [...$('summaryList').querySelectorAll('li')].map(li => '• ' + li.textContent).join('\n');
  const insights = [...$('insightsList').querySelectorAll('li')].map(li => '• ' + li.textContent).join('\n');
  const text = `Summary:\n${bullets}\n\nKey Insights:\n${insights}`;
  navigator.clipboard.writeText(text).then(() => {
    $('copyBtn').textContent = '✅ Copied';
    setTimeout(() => ($('copyBtn').textContent = '📋 Copy'), 2000);
  });
});


