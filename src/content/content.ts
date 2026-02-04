import { ShopeeStatsService } from '@/services/shopee-stats.service';

console.log('%c===== SHOPEE STATS EXTENSION LOADED =====', 'font-size: 20px; color: #ee4d2d; font-weight: bold; background: #fff3cd; padding: 10px;');
console.log('%cScript đã được inject thành công vào trang Shopee', 'font-size: 14px; color: #28a745;');
console.log('%c⚠️ Chạy trong MAIN world - Không có chrome APIs, sẽ dùng window.postMessage', 'font-size: 14px; color: #ff9800;');
alert('🚀 SHOPEE STATS: Script đã được inject! Sẽ bắt đầu thu thập dữ liệu...');

// Khởi tạo service và chạy thống kê
const runStatistics = async () => {
  try {
    console.log('%c🚀 [Content] BẮT ĐẦU CHẠY STATISTICS...', 'font-size: 16px; color: #ee4d2d; font-weight: bold;');
    const service = new ShopeeStatsService();
    
    // Thu thập thống kê
    console.log('%c📊 [Content] ĐANG THU THẬP DỮ LIỆU...', 'font-size: 16px; color: #2196f3; font-weight: bold;');
    const stats = await service.collectStatistics();
    
    // Hiển thị report ra console để debug
    console.log('%c📝 [Content] HOÀN THÀNH - HIỂN THỊ REPORT:', 'font-size: 16px; color: #4caf50; font-weight: bold;');
    service.displayReport();
    
    // Gửi kết quả qua window.postMessage (vì MAIN world không có chrome.runtime)
    console.log('📤 [Content] Gửi kết quả qua window.postMessage:', stats);
    window.postMessage({
      type: 'SHOPEE_STATS_COMPLETE',
      data: stats
    }, '*');
    console.log('✅ [Content] Đã gửi message complete thành công');
  } catch (error) {
    console.error('❌ [Content] Error running statistics:', error);
    
    // Gửi error qua window.postMessage
    window.postMessage({
      type: 'SHOPEE_STATS_ERROR',
      message: (error as Error).message
    }, '*');
  }
};

// Chạy ngay khi script được inject (MAIN world không hỗ trợ chrome.runtime.onMessage)
console.log('%c▶️ [Content] Bắt đầu chạy statistics ngay...', 'font-size: 14px; color: #2196f3; font-weight: bold;');
runStatistics();
