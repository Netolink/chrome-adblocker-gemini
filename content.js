// Cosmetic filters: Target highly specific ad selectors to avoid false positives
const cosmeticSelectors = [
  // Google & International Ad Networks
  '.adsbygoogle', 
  '[id^="div-gpt-ad"]', 
  '.ad-box', 
  '.ad-wrapper', 
  '#advertisement', 
  '.premium-ads', 
  '.sponsor-post', 
  'amp-ad',
  
  // Specific news portal containers (Strict matching to protect Github and general sites)
  '.globes-ad', 
  '[class*="market-ad"]', 
  '.strip-ad', 
  '.banner-wrap',
  '#strip_banner', 
  '.commercial-space', 
  '[id^="adv_"]', 
  '.floating-ad',
  
  // Taboola & Outbrain Widgets
  '[id^="taboola-"]', 
  '.trc_related_container', 
  '[id^="outbrain_"]', 
  '.outbrain-wrapper'
];

// Inject dynamic CSS to instantly collapse known ad selectors
function injectStyles() {
  const styleId = 'adblock-pro-cosmetic-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  
  const cssRules = cosmeticSelectors.map(selector => {
    return `${selector} { display: none !important; visibility: hidden !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }`;
  }).join('\n');

  style.textContent = cssRules;
  (document.head || document.documentElement).appendChild(style);
}

// Advanced Scanner: Detect and collapse empty containers and blocked ad frames
function collapseEmptyAdElements() {
  // 1. Collapse blocked iframes
  const adFrames = document.querySelectorAll('iframe[src*="doubleclick"], iframe[id^="google_ads_frame"], iframe[src*="googleads"]');
  adFrames.forEach(frame => {
    frame.style.setProperty('display', 'none', 'important');
    if (frame.parentElement) {
      frame.parentElement.style.setProperty('display', 'none', 'important');
    }
  });

  // 2. Scan for empty DIVs that act as empty ad wrappers with fixed heights (like on Globes)
  const potentialWrappers = document.querySelectorAll('[class*="ad"], [id*="ad"]');
  potentialWrappers.forEach(el => {
    // Skip critical development and system sites to ensure no layouts break
    const domain = window.location.hostname;
    if (domain.includes('github.com') || domain.includes('stackoverflow.com')) return;

    // Check if the element contains ad-related naming but is completely empty of visible text or source
    const hasAdWord = el.className?.toString().includes('ad-') || el.id?.toString().includes('ad-') || el.className?.toString().includes('globes');
    if (hasAdWord && el.innerText.trim() === "" && el.children.length === 0) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
    }
  });
}

function runAdBlocker() {
  const currentDomain = window.location.hostname;
  
  chrome.storage.local.get(['whitelistedDomains'], (result) => {
    const whitelist = result.whitelistedDomains || [];
    if (whitelist.includes(currentDomain)) return; 

    injectStyles();
    collapseEmptyAdElements();
  });
}

// Anti-Adblock Bypass Logic
function bypassAntiAdblock() {
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.no_ad_slot = true; 

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { 
          const text = node.innerText || "";
          if (text.includes("Disable your ad blocker") || text.includes("חוסם הפרסומות שלך פעיל")) {
            node.style.setProperty('display', 'none', 'important');
            document.body.style.setProperty('overflow', 'auto', 'important');
            document.documentElement.style.setProperty('overflow', 'auto', 'important');
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runAdBlocker();
    bypassAntiAdblock();
  });
} else {
  runAdBlocker();
  bypassAntiAdblock();
}

// Monitor modern dynamic page changes
const pageObserver = new MutationObserver(() => {
  runAdBlocker();
});
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
