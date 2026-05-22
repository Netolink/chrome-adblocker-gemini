document.addEventListener('DOMContentLoaded', async () => {
  const siteCountEl = document.getElementById('site-count');
  const globalCountEl = document.getElementById('global-count');
  const domainLabelEl = document.getElementById('domain-label');
  const toggleInput = document.getElementById('blocking-state');

  // Get the current active tab to know which website the user is browsing
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  const url = new URL(tab.url);
  const hostname = url.hostname;
  domainLabelEl.textContent = hostname.length > 20 ? hostname.substring(0, 17) + '...' : hostname;

  // Loading statistics and exclusion status from local storage
  chrome.storage.local.get(['globalCount', 'siteCounts', 'whitelistedDomains'], (result) => {
    const globalCount = result.globalCount || 0;
    const siteCounts = result.siteCounts || {};
    const whitelist = result.whitelistedDomains || [];

    globalCountEl.textContent = globalCount;
    siteCountEl.textContent = siteCounts[hostname] || 0;

    // If the site is on the exclusion list, turn off the toggle (Blocking mode: Off)
    toggleInput.checked = !whitelist.includes(hostname);
  });

  // Listening for a toggle state change
  toggleInput.addEventListener('change', () => {
    const isBlockingActive = toggleInput.checked;

    chrome.storage.local.get(['whitelistedDomains'], (result) => {
      let whitelist = result.whitelistedDomains || [];

      if (!isBlockingActive) {
        if (!whitelist.includes(hostname)) whitelist.push(hostname);
      } else {
        whitelist = whitelist.filter(domain => domain !== hostname);
      }

      chrome.storage.local.set({ whitelistedDomains: whitelist }, () => {
        // Send a message to the background to update the dynamic rules in real time
        chrome.runtime.sendMessage({
          type: "toggle_site",
          domain: hostname,
          isBlocked: isBlockingActive
        }, () => {
          // Refresh the tab so the change takes effect immediately
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });
});
