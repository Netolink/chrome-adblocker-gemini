// 1. Cosmetics: List of common ad selectors for quick hiding
const cosmeticSelectors = [
  '.adsbygoogle', '[id^="div-gpt-ad"]', '.ad-box', '.ad-wrapper', 
  '#advertisement', '.premium-ads', '.sponsor-post', 'amp-ad'
];

function applyCosmeticFilters() {
  const currentDomain = window.location.hostname;
  
  // Checking whether the user has turned off the blocker for the current website
  chrome.storage.local.get(['whitelistedDomains'], (result) => {
    const whitelist = result.whitelistedDomains || [];
    if (whitelist.includes(currentDomain)) return; // Do not block if the site is excluded

    // Hiding elements
    cosmeticSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    });
  });
}

// 2. Basic Anti-Adblock Bypass
function bypassAntiAdblock() {
  // Protection against ad blocker detection by preventing missing variable detection (shadowing)
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.no_ad_slot = true; 

  // Identifying and disabling common modals (popups) that block the screen
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Verifying that it is an HTML element
          const text = node.innerText || "";
          if (text.includes("Disable your ad blocker") || text.includes("חוסם הפרסומות שלך פעיל")) {
            node.style.setProperty('display', 'none', 'important');
            // Unlock page scrolling if the site locks it
            document.body.style.setProperty('overflow', 'auto', 'important');
            document.documentElement.style.setProperty('overflow', 'auto', 'important');
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Run with DOM loading and continuously
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyCosmeticFilters();
    bypassAntiAdblock();
  });
} else {
  applyCosmeticFilters();
  bypassAntiAdblock();
}

// Tracking dynamic page changes (e.g. lazy loading ads / infinite scroll)
const pageObserver = new MutationObserver(applyCosmeticFilters);
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
