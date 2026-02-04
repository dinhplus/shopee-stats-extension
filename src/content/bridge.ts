/**
 * Bridge script - Chạy trong ISOLATED world
 * Lắng nghe window.postMessage từ MAIN world script
 * Forward messages đến popup qua chrome.runtime
 */

console.log('🌉 [Bridge] Bridge script loaded in ISOLATED world');

// Lắng nghe messages từ MAIN world content script
window.addEventListener('message', (event) => {
  // Chỉ xử lý messages từ cùng origin
  if (event.source !== window) {
    return;
  }

  console.log('🌉 [Bridge] Received message from MAIN world:', event.data);

  // Forward messages đến popup
  if (event.data.type === 'SHOPEE_STATS_COMPLETE') {
    console.log('🌉 [Bridge] Forwarding COMPLETE to popup...');
    chrome.runtime.sendMessage({
      type: 'complete',
      data: event.data.data
    }).catch((e) => {
      console.error('🌉 [Bridge] Error sending complete:', e);
    });
  } else if (event.data.type === 'SHOPEE_STATS_ERROR') {
    console.log('🌉 [Bridge] Forwarding ERROR to popup...');
    chrome.runtime.sendMessage({
      type: 'error',
      message: event.data.message
    }).catch((e) => {
      console.error('🌉 [Bridge] Error sending error:', e);
    });
  } else if (event.data.type === 'SHOPEE_STATS_PROGRESS') {
    console.log('🌉 [Bridge] Forwarding PROGRESS to popup...');
    chrome.runtime.sendMessage({
      type: 'progress',
      message: event.data.message
    }).catch((e) => {
      console.error('🌉 [Bridge] Error sending progress:', e);
    });
  }
});

console.log('🌉 [Bridge] Ready to forward messages from MAIN world to popup');
