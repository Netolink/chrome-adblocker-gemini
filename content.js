// Cosmetic filters: Target accurate ad elements without breaking layout
const cosmeticSelectors = [
  // Google & International Ad Networks
  '.adsbygoogle', '[id^="div-gpt-ad"]', '.ad-box', '.ad-wrapper', 
  '#advertisement', '.premium-ads', '.sponsor-post', 'amp-ad',
  
  // Exact ad container matching (prevents catching words like download/read)
  '[class^="ad-container"]', '[class$="ad-container"]', 
  '[id^="ad-container"]', '[id$="ad-container"]',
  '[class^="ad_box"]', '[class$="ad_box"]',
  
  // Content Recommendation Engines (Taboola, Outbrain, etc.)
  '[id^="taboola-"]', '.trc_related_container', '[id^="outbrain_"]', '.outbrain-wrapper',
  
  // Specific containers for local and news portals (Globes, TheMarker, Ynet, etc.)
  '.g-ad', '.globes-ad', '[class*="market-ad"]', '.strip-ad', '.banner-wrap',
  '#strip_banner', '.commercial-space', '[id^="adv_"]', '.floating-ad'
];

// Inject a dynamic style rule to instantly hide elements (super fast performance)
function injectStyles() {
  const styleId = 'adblock-pro-cosmetic-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  
  // Combine all selectors and enforce collapsing rules
  const cssRules = cosmeticSelectors.map(selector => {
    return `${selector} { display: none !important; visibility: hidden !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }`;
  }).join('\n');

  style.textContent = cssRules;
  (document.head || document.documentElement).appendChild(style);
}

// Smart Scanner: Automatically detect and collapse broken/blocked iframe ad slots
function collapseBlockedFrames() {
  // Target frames loaded from known ad domains or containing specific ad-related attributes
  const adFrames = document.querySelectorAll('iframe[src*="doubleclick"], iframe[id^="google_ads_frame"], iframe[src*="googleads"]');
  adFrames.forEach(frame => {
    frame.style.setProperty('display', 'none', 'important');
    
    // Also collapse the immediate parent element if it is now completely empty
    const parent = frame.parentElement;
    if (parent && parent.children.length === 1 && parent.innerText.trim() === "") {
      parent.style.setProperty('display', 'none', 'important');
    }
  });
}

function runAdBlocker() {
  const currentDomain = window.location.hostname;
  
  chrome.storage.local.get(['whitelistedDomains'], (result) => {
    const whitelist = result.whitelistedDomains || [];
    if (whitelist.includes(currentDomain)) return; 

    injectStyles();
    collapseBlockedFrames();
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

// Initialization and triggers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runAdBlocker();
    bypassAntiAdblock();
  });
} else {
  runAdBlocker();
  bypassAntiAdblock();
}

// Observe dynamic content and handle modern single-page apps (SPAs)
const pageObserver = new MutationObserver(() => {
  runAdBlocker();
});
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
