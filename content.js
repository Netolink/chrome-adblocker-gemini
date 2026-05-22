// Cosmetic filters: Extended selectors list to remove empty ad spaces and containers
const cosmeticSelectors = [
  // Google & International Ad Networks
  '.adsbygoogle', '[id^="div-gpt-ad"]', '.ad-box', '.ad-wrapper', 
  '#advertisement', '.premium-ads', '.sponsor-post', 'amp-ad',
  '[class*="ad-container"]', '[id*="ad-container"]', '[class*="ad_box"]',
  
  // Content Recommendation Engines (Taboola, Outbrain, etc.)
  '[id^="taboola-"]', '.trc_related_container', '[id^="outbrain_"]', '.outbrain-wrapper',
  
  // Specific containers for local and news portals (Globes, TheMarker, Ynet, etc.)
  '.g-ad', '.globes-ad', '[class*="market-ad"]', '.strip-ad', '.banner-wrap',
  '#strip_banner', '.commercial-space', '[id^="adv_"]', '.floating-ad',
  
  // Clean up empty iframe wrappers
  'iframe[src*="doubleclick"]', 'iframe[id^="google_ads_frame"]'
];

function applyCosmeticFilters() {
  const currentDomain = window.location.hostname;
  
  chrome.storage.local.get(['whitelistedDomains'], (result) => {
    const whitelist = result.whitelistedDomains || [];
    if (whitelist.includes(currentDomain)) return; 

    cosmeticSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Completely hide the element and collapse the space it occupies
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('height', '0', 'important');
        el.style.setProperty('margin', '0', 'important');
        el.style.setProperty('padding', '0', 'important');
      });
    });
  });
}

// Anti-Adblock Bypass Logic
function bypassAntiAdblock() {
  // Prevent ad blocker detection via shadowing missing variables
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.no_ad_slot = true; 

  // Detect and neutralize anti-adblock overlay walls
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { 
          const text = node.innerText || "";
          if (text.includes("Disable your ad blocker") || text.includes("חוסם הפרסומות שלך פעיל")) {
            node.style.setProperty('display', 'none', 'important');
            // Restore page scrolling if locked by the site
            document.body.style.setProperty('overflow', 'auto', 'important');
            document.documentElement.style.setProperty('overflow', 'auto', 'important');
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Run on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyCosmeticFilters();
    bypassAntiAdblock();
  });
} else {
  applyCosmeticFilters();
  bypassAntiAdblock();
}

// Observe dynamic content changes (Lazy loading / Infinite Scroll)
const pageObserver = new MutationObserver(applyCosmeticFilters);
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
