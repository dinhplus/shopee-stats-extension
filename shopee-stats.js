// Main statistics collection script
(function() {
  'use strict';

  // Initialize variables
  var tongDonHang = 0;
  var tongTienTietKiem = 0;
  var tongtienhang = 0;
  var tongtienhangchuagiam = 0;
  var tongSanPhamDaMua = 0;
  var trangThaiDonHangConKhong = true;
  var offset = 0;
  var si = 20;

  // Thống kê theo thời gian
  var thongKeTheoThang = {
    '1_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
    '3_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
    '6_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
    '1_nam': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 }
  };

  // Thống kê theo năm
  var thongKeTheoNam = {};

  function xemBaoCaoThongKe() {
    var orders = [];
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        try {
          orders = JSON.parse(this.responseText)['data']['details_list'];
          
          tongDonHang += orders.length;
          trangThaiDonHangConKhong = orders.length >= si;
          
          // Thời gian hiện tại
          var now = new Date();
          var oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          var sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          var oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          
          orders.forEach(order => {
            var orderTime = getOrderTime(order);
            var orderYear = orderTime.getFullYear();
            
            let tongTienDonHang = order['info_card']['final_total'] / 100000;
            tongtienhang += tongTienDonHang;
            
            let tongTienChuaGiamDonHang = 0;
            let soSanPhamDonHang = 0;
            
            order['info_card']['order_list_cards'].forEach(item => {
              item['product_info']['item_groups'].forEach(itemGroups => {
                itemGroups['items'].forEach(data => {
                  let t5 = data['order_price'] / 100000;
                  soSanPhamDonHang += data['amount'];
                  tongSanPhamDaMua += data['amount'];
                  tongTienChuaGiamDonHang += t5;
                  tongtienhangchuagiam += t5;
                });
              });
            });
            
            // Thống kê theo thời gian gần đây
            if (orderTime >= oneMonthAgo) {
              thongKeTheoThang['1_thang'].tongTien += tongTienDonHang;
              thongKeTheoThang['1_thang'].donHang += 1;
              thongKeTheoThang['1_thang'].sanPham += soSanPhamDonHang;
              thongKeTheoThang['1_thang'].tienChuaGiam += tongTienChuaGiamDonHang;
            }
            if (orderTime >= threeMonthsAgo) {
              thongKeTheoThang['3_thang'].tongTien += tongTienDonHang;
              thongKeTheoThang['3_thang'].donHang += 1;
              thongKeTheoThang['3_thang'].sanPham += soSanPhamDonHang;
              thongKeTheoThang['3_thang'].tienChuaGiam += tongTienChuaGiamDonHang;
            }
            if (orderTime >= sixMonthsAgo) {
              thongKeTheoThang['6_thang'].tongTien += tongTienDonHang;
              thongKeTheoThang['6_thang'].donHang += 1;
              thongKeTheoThang['6_thang'].sanPham += soSanPhamDonHang;
              thongKeTheoThang['6_thang'].tienChuaGiam += tongTienChuaGiamDonHang;
            }
            if (orderTime >= oneYearAgo) {
              thongKeTheoThang['1_nam'].tongTien += tongTienDonHang;
              thongKeTheoThang['1_nam'].donHang += 1;
              thongKeTheoThang['1_nam'].sanPham += soSanPhamDonHang;
              thongKeTheoThang['1_nam'].tienChuaGiam += tongTienChuaGiamDonHang;
            }
            
            // Thống kê theo năm
            var orderMonth = (orderTime.getMonth() + 1).toString(); // 1-12
            
            if (!thongKeTheoNam[orderYear]) {
              thongKeTheoNam[orderYear] = {
                total: {
                  tongTien: 0,
                  donHang: 0,
                  sanPham: 0,
                  tienChuaGiam: 0
                },
                months: {}
              };
            }
            
            // Cập nhật tổng năm
            thongKeTheoNam[orderYear].total.tongTien += tongTienDonHang;
            thongKeTheoNam[orderYear].total.donHang += 1;
            thongKeTheoNam[orderYear].total.sanPham += soSanPhamDonHang;
            thongKeTheoNam[orderYear].total.tienChuaGiam += tongTienChuaGiamDonHang;
            
            // Cập nhật theo tháng
            if (!thongKeTheoNam[orderYear].months[orderMonth]) {
              thongKeTheoNam[orderYear].months[orderMonth] = {
                tongTien: 0,
                donHang: 0,
                sanPham: 0,
                tienChuaGiam: 0
              };
            }
            
            thongKeTheoNam[orderYear].months[orderMonth].tongTien += tongTienDonHang;
            thongKeTheoNam[orderYear].months[orderMonth].donHang += 1;
            thongKeTheoNam[orderYear].months[orderMonth].sanPham += soSanPhamDonHang;
            thongKeTheoNam[orderYear].months[orderMonth].tienChuaGiam += tongTienChuaGiamDonHang;
          });
          
          offset += si;
          if (trangThaiDonHangConKhong) {
            console.log('Đã thống kê được: ' + tongDonHang + ' đơn hàng. Đang lấy thêm dữ liệu....');
            
            // Send progress update to popup
            try {
              chrome.runtime.sendMessage({
                type: 'progress',
                message: 'Đã xử lý ' + tongDonHang + ' đơn hàng...'
              });
            } catch (e) {
              // Extension context might be invalid
            }
            
            xemBaoCaoThongKe();
          } else {
            tongTienTietKiem = tongtienhangchuagiam - tongtienhang;
            
            // Display results
            hienThiBaoCao();
            
            // Notify popup that processing is complete
            try {
              chrome.runtime.sendMessage({
                type: 'complete',
                data: {
                  tongDonHang: tongDonHang,
                  tongtienhang: tongtienhang,
                  tongTienTietKiem: tongTienTietKiem,
                  tongSanPhamDaMua: tongSanPhamDaMua,
                  thongKeTheoThang: thongKeTheoThang,
                  thongKeTheoNam: thongKeTheoNam,
                  tongtienhangchuagiam: tongtienhangchuagiam
                }
              });
            } catch (e) {
              // Extension context might be invalid
            }
          }
        } catch (error) {
          console.error('Error processing orders:', error);
          try {
            chrome.runtime.sendMessage({
              type: 'error',
              message: error.message
            });
          } catch (e) {
            // Extension context might be invalid
          }
        }
      } else if (this.readyState == 4 && this.status !== 200) {
        console.error('Failed to fetch orders. Status:', this.status);
        try {
          chrome.runtime.sendMessage({
            type: 'error',
            message: 'Không thể lấy dữ liệu. Vui lòng đảm bảo bạn đã đăng nhập Shopee.'
          });
        } catch (e) {
          // Extension context might be invalid
        }
      }
    };

    xhttp.open(
      'GET',
      'https://shopee.vn/api/v4/order/get_order_list?list_type=3&offset=' + offset + '&limit=' + si,
      true,
    );
    xhttp.send();
  }

  function hienThiBaoCao() {
    // TỔNG QUAN
    console.log('\n');
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'font-size: 16px; color: #ff5722;');
    console.log('%c║           📊 BÁO CÁO THỐNG KÊ SHOPEE TOÀN DIỆN            ║', 'font-size: 16px; color: #ff5722;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'font-size: 16px; color: #ff5722;');
    console.log('\n');
    
    console.log('%c' + PXGCert(tongtienhang), 'font-size:26px; font-weight: bold;');
    console.log('\n');
    
    console.log('%c🔥 TỔNG QUAN TOÀN BỘ THỜI GIAN', 'font-size: 22px; color: #ff9800; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '%c💰 Tổng chi tiêu: ' + '%c' + pxgPrice(tongtienhang) + ' vnđ',
      'font-size: 20px;',
      'font-size: 26px; color: #f44336; font-weight: bold;',
    );
    console.log(
      '%c📦 Tổng đơn hàng: ' + '%c' + pxgPrice(tongDonHang) + ' đơn',
      'font-size: 18px;',
      'font-size: 20px; color: #4caf50; font-weight: bold;',
    );
    console.log(
      '%c🛍️ Tổng sản phẩm: ' + '%c' + pxgPrice(tongSanPhamDaMua) + ' sản phẩm',
      'font-size: 18px;',
      'font-size: 20px; color: #2196f3; font-weight: bold;',
    );
    console.log(
      '%c🎉 Tiết kiệm được: ' + '%c' + pxgPrice(tongTienTietKiem) + ' vnđ',
      'font-size: 18px;',
      'font-size: 20px; color: #4caf50; font-weight: bold;',
    );
    console.log('\n');
    
    // THỐNG KÊ THEO THỜI GIAN GẦN ĐÂY
    console.log('%c⏰ THỐNG KÊ THEO THỜI GIAN GẦN ĐÂY', 'font-size: 22px; color: #2196f3; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1 tháng gần nhất
    var tietKiem1Thang = thongKeTheoThang['1_thang'].tienChuaGiam - thongKeTheoThang['1_thang'].tongTien;
    console.log('%c📅 1 THÁNG GẦN NHẤT:', 'font-size: 18px; color: #ff9800; font-weight: bold;');
    console.log('   💰 Chi tiêu: %c' + pxgPrice(thongKeTheoThang['1_thang'].tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
    console.log('   📦 Đơn hàng: ' + pxgPrice(thongKeTheoThang['1_thang'].donHang) + ' đơn');
    console.log('   🛍️ Sản phẩm: ' + pxgPrice(thongKeTheoThang['1_thang'].sanPham) + ' sản phẩm');
    console.log('   🎉 Tiết kiệm: %c' + pxgPrice(tietKiem1Thang) + ' vnđ', 'color: #4caf50;');
    console.log('');
    
    // 3 tháng gần nhất
    var tietKiem3Thang = thongKeTheoThang['3_thang'].tienChuaGiam - thongKeTheoThang['3_thang'].tongTien;
    console.log('%c📅 3 THÁNG GẦN NHẤT:', 'font-size: 18px; color: #ff9800; font-weight: bold;');
    console.log('   💰 Chi tiêu: %c' + pxgPrice(thongKeTheoThang['3_thang'].tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
    console.log('   📦 Đơn hàng: ' + pxgPrice(thongKeTheoThang['3_thang'].donHang) + ' đơn');
    console.log('   🛍️ Sản phẩm: ' + pxgPrice(thongKeTheoThang['3_thang'].sanPham) + ' sản phẩm');
    console.log('   🎉 Tiết kiệm: %c' + pxgPrice(tietKiem3Thang) + ' vnđ', 'color: #4caf50;');
    console.log('');
    
    // 6 tháng gần nhất
    var tietKiem6Thang = thongKeTheoThang['6_thang'].tienChuaGiam - thongKeTheoThang['6_thang'].tongTien;
    console.log('%c📅 6 THÁNG GẦN NHẤT:', 'font-size: 18px; color: #ff9800; font-weight: bold;');
    console.log('   💰 Chi tiêu: %c' + pxgPrice(thongKeTheoThang['6_thang'].tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
    console.log('   📦 Đơn hàng: ' + pxgPrice(thongKeTheoThang['6_thang'].donHang) + ' đơn');
    console.log('   🛍️ Sản phẩm: ' + pxgPrice(thongKeTheoThang['6_thang'].sanPham) + ' sản phẩm');
    console.log('   🎉 Tiết kiệm: %c' + pxgPrice(tietKiem6Thang) + ' vnđ', 'color: #4caf50;');
    console.log('');
    
    // 1 năm gần nhất
    var tietKiem1Nam = thongKeTheoThang['1_nam'].tienChuaGiam - thongKeTheoThang['1_nam'].tongTien;
    console.log('%c📅 1 NĂM GẦN NHẤT:', 'font-size: 18px; color: #ff9800; font-weight: bold;');
    console.log('   💰 Chi tiêu: %c' + pxgPrice(thongKeTheoThang['1_nam'].tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
    console.log('   📦 Đơn hàng: ' + pxgPrice(thongKeTheoThang['1_nam'].donHang) + ' đơn');
    console.log('   🛍️ Sản phẩm: ' + pxgPrice(thongKeTheoThang['1_nam'].sanPham) + ' sản phẩm');
    console.log('   🎉 Tiết kiệm: %c' + pxgPrice(tietKiem1Nam) + ' vnđ', 'color: #4caf50;');
    console.log('\n');
    
    // THỐNG KÊ THEO NĂM
    console.log('%c📊 THỐNG KÊ CHI TIÊU THEO NĂM', 'font-size: 22px; color: #9c27b0; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Sắp xếp các năm theo thứ tự giảm dần
    var sortedYears = Object.keys(thongKeTheoNam).sort((a, b) => b - a);
    
    sortedYears.forEach(year => {
      var data = thongKeTheoNam[year].total;
      var tietKiemNam = data.tienChuaGiam - data.tongTien;
      console.log('%c🗓️ NĂM ' + year + ':', 'font-size: 18px; color: #ff9800; font-weight: bold;');
      console.log('   💰 Chi tiêu: %c' + pxgPrice(data.tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
      console.log('   📦 Đơn hàng: ' + pxgPrice(data.donHang) + ' đơn');
      console.log('   🛍️ Sản phẩm: ' + pxgPrice(data.sanPham) + ' sản phẩm');
      console.log('   🎉 Tiết kiệm: %c' + pxgPrice(tietKiemNam) + ' vnđ', 'color: #4caf50;');
      console.log('');
    });
    console.log('\n');
  }

  function PXGCert(pri) {
    if (pri <= 10000000) {
      return 'HÊN QUÁ! BẠN CHƯA BỊ SHOPEE GÂY NGHIỆN 😍';
    } else if (pri > 10000000 && pri <= 50000000) {
      return 'THÔI XONG! BẠN BẮT ĐẦU NGHIỆN SHOPEE RỒI 😂';
    } else if (pri > 50000000 && pri < 80000000) {
      return 'ỐI GIỜI ƠI! BẠN LÀ CON NGHIỆN SHOPEE CHÍNH HIỆU 😱';
    } else {
      return 'XÓA APP SHOPEE THÔI! BẠN NGHIỆN SHOPEE NẶNG QUÁ RỒI 😝';
    }
  }

  function pxgPrice(number, fixed = 0) {
    if (isNaN(number)) return 0;
    number = number.toFixed(fixed);
    let delimeter = ',';
    number += '';
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(number)) {
      number = number.replace(rgx, '$1' + delimeter + '$2');
    }
    return number;
  }

  function getOrderTime(order) {
    return new Date(order.shipping.tracking_info.ctime * 1000);
  }

  // Start the statistics collection
  console.log('🚀 Bắt đầu thống kê chi tiêu Shopee...');
  xemBaoCaoThongKe();

})();
