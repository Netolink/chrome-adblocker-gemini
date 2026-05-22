// Cosmetic filters: Target accurate ad elements without breaking layout
const cosmeticSelectors = [
  '.adsbygoogle', 
  '[id^="div-gpt-ad"]', 
  '.ad-box', 
  '.ad-wrapper', 
  '#advertisement', 
  '.premium-ads', 
  '.sponsor-post', 
  'amp-ad',
  
  // Strict matching for ad containers to protect general layouts
  '[class^="ad-container"]', '[class$="ad-container"]', 
  '[id^="ad-container"]', '[id$="ad-container"]',
  '[class^="ad_box"]', '[class$="ad_box"]',
  
  // Content Recommendation Engines
  '[id^="taboola-"]', '.trc_related_container', '[id^="outbrain_"]', '.outbrain-wrapper',
  
  // Portal specific wrappers (TheMarker, Globes, Ynet, etc.)
  '.globes-ad', '[class*="market-ad"]', '.strip-ad', '.banner-wrap',
  '#strip_banner', '.commercial-space', '[id^="adv_"]', '.floating-ad'
];

function injectStyles() {
  const styleId = 'adblock-pro-cosmetic-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  
  const cssRules = cosmeticSelectors.map(selector => {
    return `${selector} { display: none !important; visibility: hidden !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }`;
  }).join('\n');

  style.textContent = cssRules;
  const target = document.head || document.documentElement;
  if (target) target.appendChild(style);
}

function collapseEmptyAdElements() {
  const domain = window.location.hostname;
  // Bypasses development environments to prevent code breakage
  if (domain.includes('github.com') || domain.includes('stackoverflow.com')) return;

  // Collapse blocked iframes
  const adFrames = document.querySelectorAll('iframe[src*="doubleclick"], iframe[id^="google_ads_frame"], iframe[src*="googleads"]');
  adFrames.forEach(frame => {
    frame.style.setProperty('display', 'none', 'important');
    if (frame.parentElement) {
      frame.parentElement.style.setProperty('display', 'none', 'important');
    }
  });

  // Collapse empty ad DIVs with fixed heights (e.g., Globes, TheMarker)
  const potentialWrappers = document.querySelectorAll('[class*="ad"], [id*="ad"], [class*="banner"]');
  potentialWrappers.forEach(el => {
    const className = el.className?.toString() || "";
    const idName = el.id?.toString() || "";
    
    const hasAdWord = className.includes('ad-') || idName.includes('ad-') || className.includes('market') || className.includes('globes');
    if (hasAdWord && el.innerText.trim() === "" && el.children.length === 0) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('padding', '0', 'important');
    }
  });
}

function runAdBlocker() {
  // Safe API wrapper to completely eliminate "Extension context invalidated" errors
  try {
    if (!chrome.runtime?.id) return; // Check if extension context is still valid
    
    chrome.storage.local.get(['whitelistedDomains'], (result) => {
      if (chrome.runtime.lastError) return;
      
      const whitelist = result?.whitelistedDomains || [];
      if (whitelist.includes(window.location.hostname)) return; 

      injectStyles();
      collapseEmptyAdElements();
    });
  } catch (e) {
    // Silently catch context invalidation during extension reloads
  }
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

// Initialization Triggers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runAdBlocker();
    bypassAntiAdblock();
  });
} else {
  runAdBlocker();
  bypassAntiAdblock();
}

const pageObserver = new MutationObserver(() => {
  runAdBlocker();
});
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
