console.log("🌉 [Bridge] Bridge script loaded in ISOLATED world");

// Helper to safely send messages
function safeSendMessage(message) {
  if (!chrome.runtime?.id) {
    console.warn("🌉 [Bridge] Extension context invalidated, skipping message");
    return;
  }
  
  try {
    chrome.runtime.sendMessage(message).catch(err => {
      if (err.message?.includes('Extension context invalidated')) {
        console.warn("🌉 [Bridge] Extension reloaded, stopping message forwarding");
      } else {
        console.error("🌉 [Bridge] Error sending message:", err);
      }
    });
  } catch (err) {
    console.error("🌉 [Bridge] Unexpected error:", err);
  }
}

window.addEventListener("message", e => {
  if (e.source !== window) return;
  console.log("🌉 [Bridge] Received message from MAIN world:", e.data);
  
  if (e.data.type === "SHOPEE_STATS_COMPLETE") {
    console.log("🌉 [Bridge] Forwarding COMPLETE to popup...");
    safeSendMessage({ type: "complete", data: e.data.data });
  } else if (e.data.type === "SHOPEE_STATS_ERROR") {
    console.log("🌉 [Bridge] Forwarding ERROR to popup...");
    safeSendMessage({ type: "error", message: e.data.message });
  } else if (e.data.type === "SHOPEE_STATS_PROGRESS") {
    console.log("🌉 [Bridge] Forwarding PROGRESS to popup...");
    safeSendMessage({ type: "progress", message: e.data.message });
  }
});

console.log("🌉 [Bridge] Ready to forward messages");
