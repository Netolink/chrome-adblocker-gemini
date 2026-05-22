// Listening for network blocks to update the counter
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  const url = new URL(info.request.url);
  const hostname = url.hostname;

  chrome.storage.local.get(['globalCount', 'siteCounts'], (result) => {
    let globalCount = result.globalCount || 0;
    let siteCounts = result.siteCounts || {};

    globalCount++;
    siteCounts[hostname] = (siteCounts[hostname] || 0) + 1;

    chrome.storage.local.set({ globalCount, siteCounts });
    
    // Updating the number on the extension icon in the browser
    chrome.action.setBadgeText({ text: globalCount.toString() });
  });
});

// Dynamic whitelist update function
async function updateWhitelist(domain, isBlocked) {
  const ruleId = Math.abs(domain.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 5000;

  if (!isBlocked) {
    // If the user has turned off the blocker for this site - we will add an exception rule (allow)
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 2, // Higher priority than regular blocking rules
        action: { type: "allow" },
        condition: { urlFilter: `||${domain}^`, resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"] }
      }],
      removeRuleIds: [ruleId]
    });
  } else {
    // If the user re-activated - we will remove the exception
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId]
    });
  }
}

// Receiving notifications from the Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "toggle_site") {
    updateWhitelist(message.domain, message.isBlocked).then(() => sendResponse({ success: true }));
    return true; 
  }
});
