const input = document.getElementById('apiKey');
const msg = document.getElementById('msg');

chrome.storage.local.get('apiKey', ({ apiKey }) => {
  if (apiKey) input.value = apiKey;
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const key = input.value.trim();
  if (!key) { msg.style.color = '#ef4444'; msg.textContent = 'Please enter a valid API key.'; return; }
  chrome.storage.local.set({ apiKey: key }, () => {
    msg.style.color = '#16a34a';
    msg.textContent = '✓ API key saved.';
    setTimeout(() => (msg.textContent = ''), 3000);
  });
});
