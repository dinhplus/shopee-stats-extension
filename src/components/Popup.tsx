import React, { useState, useEffect } from 'react';
import type { Statistics } from '@/types/shopee';
import { formatPrice, getSpendingAssessment } from '@/utils/format';
import './Popup.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Message {
  text: string;
  type: 'success' | 'error';
}

export const Popup: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<string>('');
  const [message, setMessage] = useState<Message | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const toggleYearExpansion = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  // Load saved statistics and state on mount
  useEffect(() => {
    chrome.storage.local.get(['shopeeStats', 'isLoading', 'loadingProgress'], (result) => {
      if (result.shopeeStats) {
        setStatistics(result.shopeeStats as Statistics);
        setStatus('success');
      }
      if (result.isLoading) {
        setStatus('loading');
        setProgress((result.loadingProgress as string) || '');
      }
    });
  }, []);

  const handleStartStats = async () => {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('Không thể xác định tab hiện tại');
      }

      // Check if we're on Shopee
      if (!tab.url?.includes('shopee.vn')) {
        setMessage({
          text: 'Vui lòng mở trang Shopee.vn trước khi sử dụng extension này',
          type: 'error'
        });
        return;
      }

      // Reset state
      setStatus('loading');
      setMessage(null);
      setProgress('');
      setStatistics(null);
      
      // Save loading state to storage
      chrome.storage.local.set({ isLoading: true, loadingProgress: '' });
      
      console.log('🚀 [Popup] Bắt đầu thống kê...');

      // Listen for messages
      const messageListener = (request: any) => {
        console.log('📨 [Popup] Received message:', request.type, request);
        if (request.type === 'progress') {
          setProgress(request.message);
          chrome.storage.local.set({ loadingProgress: request.message });
        } else if (request.type === 'complete') {
          console.log('✅ [Popup] Nhận được kết quả:', request.data);
          console.log('📊 [Popup] Data structure:', {
            tongDonHang: request.data?.tongDonHang,
            hasThongKeTheoThang: !!request.data?.thongKeTheoThang,
            hasThongKeTheoNam: !!request.data?.thongKeTheoNam
          });
          setStatus('success');
          setStatistics(request.data);
          // Save to storage and clear loading state
          chrome.storage.local.set({ 
            shopeeStats: request.data,
            isLoading: false,
            loadingProgress: ''
          });
          chrome.runtime.onMessage.removeListener(messageListener);
        } else if (request.type === 'error') {
          console.error('❌ [Popup] Nhận được lỗi:', request.message);
          setStatus('error');
          setMessage({
            text: '❌ Lỗi: ' + request.message,
            type: 'error'
          });
          chrome.storage.local.set({ isLoading: false, loadingProgress: '' });
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Inject bridge script first (ISOLATED world - có chrome APIs)
      console.log('💉 [Popup] Injecting bridge script into tab:', tab.id);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'ISOLATED',
        files: ['content/bridge.js']
      });
      console.log('✅ [Popup] Bridge script injected');

      // Inject content script (MAIN world - có cookies)
      console.log('💉 [Popup] Injecting content script into tab:', tab.id);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        files: ['content/content.js']
      });
      console.log('✅ [Popup] Content script injected - Statistics đang chạy...');

    } catch (error) {
      console.error('❌ [Popup] Error:', error);
      setStatus('error');
      setMessage({
        text: '❌ Có lỗi xảy ra: ' + (error as Error).message,
        type: 'error'
      });
      chrome.storage.local.set({ isLoading: false, loadingProgress: '' });
    }
  };

  const handleReset = () => {
    console.log('🔄 [Popup] Reset statistics');
    setStatistics(null);
    setStatus('idle');
    setMessage(null);
    setProgress('');
    chrome.storage.local.remove(['shopeeStats', 'isLoading', 'loadingProgress']);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>📊 Shopee Thống Kê</h1>
        <p className="subtitle">Xem chi tiêu của bạn trên Shopee</p>
      </div>

      <div className="content">
        <div className="content-inner">
          {!statistics ? (
            <>
              <button
                id="startStats"
                className="btn-primary"
                onClick={handleStartStats}
                disabled={status === 'loading'}
              >
                🚀 Bắt Đầu Thống Kê
              </button>

              {status === 'loading' && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Đang lấy dữ liệu...</p>
                  {progress && <p className="progress">{progress}</p>}
                </div>
              )}

              {message && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </>
          ) : (
            <div className="statistics">
            <div className="stats-header">
              <h2>{getSpendingAssessment(statistics.tongtienhang)}</h2>
              <button className="btn-reset" onClick={handleReset}>
                🔄 Bắt Đầu Lại
              </button>
            </div>

            <div className="stats-overview">
              <h3>🔥 Tổng Quan</h3>
              <div className="stat-grid">
                <div className="stat-item highlight">
                  <span className="stat-label">💰 Tổng chi tiêu</span>
                  <span className="stat-value">{formatPrice(statistics.tongtienhang)} đ</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">📦 Đơn hàng</span>
                  <span className="stat-value">{formatPrice(statistics.tongDonHang)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">🛍️ Sản phẩm</span>
                  <span className="stat-value">{formatPrice(statistics.tongSanPhamDaMua)}</span>
                </div>
                <div className="stat-item success">
                  <span className="stat-label">🎉 Tiết kiệm</span>
                  <span className="stat-value">{formatPrice(statistics.tongTienTietKiem)} đ</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h3>⏰ Thống Kê Gần Đây</h3>
              <div className="time-stats">
                {statistics.thongKeTheoThang && [
                  { key: '1_thang', label: '1 Tháng' },
                  { key: '3_thang', label: '3 Tháng' },
                  { key: '6_thang', label: '6 Tháng' },
                  { key: '1_nam', label: '1 Năm' }
                ].map(({ key, label }) => {
                  const data = statistics.thongKeTheoThang[key as keyof typeof statistics.thongKeTheoThang];
                  if (!data) return null;
                  return (
                    <div key={key} className="time-item">
                      <div className="time-label">{label}</div>
                      <div className="time-data">
                        <span>{formatPrice(data.tongTien)} đ</span>
                        <span className="time-meta">{data.donHang} đơn • {data.sanPham} sp</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stats-section">
              <h3>📊 Theo Năm</h3>
              <div className="year-stats">
                {statistics.thongKeTheoNam && Object.keys(statistics.thongKeTheoNam)
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => {
                    const yearData = statistics.thongKeTheoNam[year];
                    const isExpanded = expandedYears.has(year);
                    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                                       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
                    
                    return (
                      <div key={year} className="year-item-wrapper">
                        <div className="year-item">
                          <div className="year-label">🗓️ {year}</div>
                          <div className="year-data">
                            <span>{formatPrice(yearData.total.tongTien)} đ</span>
                            <span className="year-meta">{yearData.total.donHang} đơn • {yearData.total.sanPham} sp</span>
                          </div>
                          <button 
                            className="btn-detail"
                            onClick={() => toggleYearExpansion(year)}
                          >
                            {isExpanded ? '▲ Ẩn' : '▼ Chi tiết'}
                          </button>
                        </div>
                        
                        {isExpanded && yearData.months && Object.keys(yearData.months).length > 0 && (
                          <div className="month-breakdown">
                            {Object.keys(yearData.months)
                              .sort((a, b) => Number(a) - Number(b))
                              .map((month) => {
                                const monthData = yearData.months[month];
                                const monthIndex = Number(month) - 1;
                                return (
                                  <div key={month} className="month-item">
                                    <div className="month-label">📅 {monthNames[monthIndex]}</div>
                                    <div className="month-data">
                                      <span>{formatPrice(monthData.tongTien)} đ</span>
                                      <span className="month-meta">{monthData.donHang} đơn • {monthData.sanPham} sp</span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
        </div>
        
        <div className="footer">
          <p className="note">Extension này chỉ hoạt động khi bạn đã đăng nhập Shopee</p>
        </div>
      </div>
    </div>
  );
};
