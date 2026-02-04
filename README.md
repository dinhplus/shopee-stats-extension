# 📊 Shopee Thống Kê Chi Tiêu - Chrome Extension

Extension Chrome giúp bạn xem thống kê chi tiêu trên Shopee theo thời gian và theo năm.

## ✨ Tính năng

- 📈 **Thống kê theo thời gian**: 1 tháng, 3 tháng, 6 tháng, 1 năm gần nhất
- 📊 **Thống kê theo năm**: Chi tiêu từng năm từ đầu đến cuối
- 💰 **Tổng quan**: Tổng chi tiêu, đơn hàng, sản phẩm, tiền tiết kiệm
- 🎨 **Giao diện đẹp**: Popup đẹp mắt với màu sắc Shopee
- 📱 **Dễ sử dụng**: Chỉ cần 1 click để xem thống kê

## 🚀 Cài đặt

### Cách 1: Cài đặt từ source code

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật "Developer mode" (góc trên bên phải)
3. Click "Load unpacked"
4. Chọn thư mục `shopee-stats-extension`
5. Extension sẽ xuất hiện trong danh sách extension

### Cách 2: Tạo icon cho extension (tùy chọn)

Extension cần các icon kích thước 16x16, 48x48, và 128x128 pixels. Bạn có thể:
- Tạo icon bằng công cụ thiết kế (Figma, Canva, etc.)
- Hoặc tạm thời bỏ phần icon trong `manifest.json`

## 📖 Hướng dẫn sử dụng

1. Đăng nhập vào tài khoản Shopee tại [shopee.vn](https://shopee.vn)
2. Click vào icon extension trên thanh công cụ Chrome
3. Click nút "🚀 Bắt Đầu Thống Kê"
4. Đợi extension thu thập dữ liệu (có thể mất vài phút tùy số đơn hàng)
5. Mở Console (F12) để xem báo cáo chi tiết đẹp mắt

## 📋 Báo cáo bao gồm

### 🔥 Tổng quan toàn bộ thời gian
- 💰 Tổng chi tiêu
- 📦 Tổng đơn hàng
- 🛍️ Tổng sản phẩm
- 🎉 Tiền tiết kiệm được

### ⏰ Thống kê theo thời gian gần đây
- 📅 1 tháng gần nhất
- 📅 3 tháng gần nhất
- 📅 6 tháng gần nhất
- 📅 1 năm gần nhất

### 📊 Thống kê chi tiêu theo năm
- Chi tiêu từng năm (từ năm mới nhất đến cũ nhất)
- Số đơn hàng, sản phẩm, và tiền tiết kiệm mỗi năm

## 🔒 Quyền truy cập

Extension chỉ yêu cầu:
- `activeTab`: Để chạy script trên tab hiện tại
- `scripting`: Để inject script vào trang Shopee
- `https://shopee.vn/*`: Chỉ hoạt động trên trang Shopee

## 🛡️ Bảo mật

- Extension chỉ chạy trên trang Shopee.vn
- Không thu thập hoặc gửi dữ liệu ra ngoài
- Dữ liệu chỉ được xử lý local trên máy bạn
- Không lưu trữ thông tin cá nhân

## 🐛 Xử lý lỗi

### Extension không hoạt động?
- Đảm bảo bạn đã đăng nhập Shopee
- Refresh lại trang Shopee
- Reload extension tại `chrome://extensions/`

### Không có dữ liệu?
- Kiểm tra xem bạn có đơn hàng đã giao chưa
- Mở Console (F12) để xem log chi tiết

## 📝 Cấu trúc dự án

```
shopee-stats-extension/
├── manifest.json          # Cấu hình extension
├── popup.html            # Giao diện popup
├── popup.css             # Style cho popup
├── popup.js              # Logic xử lý popup
├── content.js            # Content script
├── shopee-stats.js       # Script thống kê chính
├── README.md             # File này
└── icons/                # Thư mục chứa icon (cần tạo)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎨 Tùy chỉnh

Bạn có thể tùy chỉnh:
- Màu sắc trong `popup.css`
- Format hiển thị trong `shopee-stats.js`
- Thêm các loại thống kê khác

## 📄 License

Free to use - Sử dụng tự do

## 👨‍💻 Phát triển

Dựa trên script shopeeThongke.js được chuyển đổi thành Chrome Extension với:
- UI/UX được cải thiện
- Error handling tốt hơn
- Progress tracking
- Message passing giữa popup và content script

---

Made with ❤️ for Shopee users
