// Relays the chrome.commands keyboard shortcut to the content script.
// If the content script is not present (e.g. the extension was just
// updated/installed and the Discord tab was never reloaded), inject it on
// demand and retry — so the shortcut works without a manual tab reload.

function deliverToggle(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: "dcqf:toggle" });
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log("[DCQF-BG] command received:", command);
  if (command !== "toggle-search") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("[DCQF-BG] active tab:", tab?.id, tab?.url);
  if (!tab?.id) {
    console.log("[DCQF-BG] no active tab id, abort");
    return;
  }

  try {
    await deliverToggle(tab.id);
    console.log("[DCQF-BG] message delivered");
  } catch (e) {
    console.log("[DCQF-BG] sendMessage failed, attempting injection:", e?.message);
    try {
      // CSS first so the freshly-injected overlay is styled correctly even if
      // the original content_scripts injection never ran on this tab.
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["src/overlay.css"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content.js"],
      });
      await deliverToggle(tab.id);
      console.log("[DCQF-BG] message delivered after injection");
    } catch (e2) {
      console.log("[DCQF-BG] injection also failed:", e2?.message);
    }
  }
});

console.log("[DCQF-BG] service worker started");
