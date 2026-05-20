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
    await chrome.tabs.sendMessage(tab.id, { type: "dcqf:toggle" });
    console.log("[DCQF-BG] message delivered");
  } catch (e) {
    console.log(
      "[DCQF-BG] sendMessage failed (content script likely not loaded — reload the Discord tab):",
      e?.message
    );
  }
});

console.log("[DCQF-BG] service worker started");
