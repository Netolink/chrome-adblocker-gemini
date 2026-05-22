// Cosmetic filters: Base selectors for common ad components
const cosmeticSelectors = [
  '.adsbygoogle', 
  '[id^="div-gpt-ad"]', 
  '.ad-box', 
  '.ad-wrapper', 
  '#advertisement', 
  '.premium-ads', 
  '.sponsor-post', 
  'amp-ad',
  'iframe[src*="doubleclick"]', 
  'iframe[id^="google_ads_frame"]', 
  'iframe[src*="googleads"]',
  '[id^="taboola-"]', 
  '.trc_related_container', 
  '[id^="outbrain_"]', 
  '.outbrain-wrapper',
  '.globes-ad', 
  '[class*="market-ad"]', 
  '.strip-ad', 
  '.banner-wrap',
  '#strip_banner', 
  '.commercial-space', 
  '[id^="adv_"]', 
  '.floating-ad'
];

// Inject dynamic CSS to collapse targeted elements instantly
function injectStyles() {
  try {
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
  } catch (e) {}
}

// Deep Structural Scanner: Collapses empty ad containers and fixed-height wrappers
function collapseEmptyAdElements() {
  try {
    const domain = window.location.hostname;
    if (domain.includes('github.com') || domain.includes('stackoverflow.com')) return;

    // 1. Target known ad slots (like Google DFP/GPT used by Globes and TheMarker)
    const adSlots = document.querySelectorAll('[id^="div-gpt-ad"], iframe[src*="doubleclick"], iframe[id^="google_ads_frame"], .adsbygoogle');
    
    adSlots.forEach(slot => {
      // Hide the slot itself
      slot.style.setProperty('display', 'none', 'important');
      slot.style.setProperty('height', '0', 'important');

      // Traverse up to find fixed-height wrappers (e.g., #jumbo_container or .gam-placeholder)
      let parent = slot.parentElement;
      for (let i = 0; i < 3; i++) { // Check up to 3 levels up the DOM tree
        if (!parent || parent === document.body) break;
        
        const parentId = parent.id?.toString() || "";
        const parentClass = parent.className?.toString() || "";
        
        // If the parent is an ad wrapper, a banner layout, or a placeholder container
        if (
          parentId.includes('jumbo') || 
          parentClass.includes('Banner') || 
          parentClass.includes('placeholder') || 
          parentClass.includes('advert') ||
          parentClass.includes('commercial')
        ) {
          parent.style.setProperty('display', 'none', 'important');
          parent.style.setProperty('height', '0', 'important');
          parent.style.setProperty('min-height', '0', 'important');
          parent.style.setProperty('margin', '0', 'important');
          parent.style.setProperty('padding', '0', 'important');
        }
        parent = parent.parentElement;
      }
    });
  } catch (e) {}
}

function runAdBlocker() {
  try {
    if (!chrome.runtime?.id) return; // Prevent "Extension context invalidated"
    
    chrome.storage.local.get(['whitelistedDomains'], (result) => {
      if (chrome.runtime.lastError) return;
      
      const whitelist = result?.whitelistedDomains || [];
      if (whitelist.includes(window.location.hostname)) return; 

      injectStyles();
      collapseEmptyAdElements();
    });
  } catch (e) {}
}

// Anti-Adblock Bypass Logic
function bypassAntiAdblock() {
  try {
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
  } catch (e) {}
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

const pageObserver = new MutationObserver(() => {
  runAdBlocker();
});
pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
