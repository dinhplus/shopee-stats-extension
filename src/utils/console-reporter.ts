import { formatPrice } from './format';

/**
 * In báo cáo thống kê chi tiết ra console với format đẹp
 */
export class ConsoleReporter {
  /**
   * In header của báo cáo
   */
  static printHeader(): void {
    console.log('\n');
    console.log('%c╔════════════════════════════════════════════════════════════╗', 'font-size: 16px; color: #ff5722;');
    console.log('%c║           📊 BÁO CÁO THỐNG KÊ SHOPEE TOÀN DIỆN            ║', 'font-size: 16px; color: #ff5722;');
    console.log('%c╚════════════════════════════════════════════════════════════╝', 'font-size: 16px; color: #ff5722;');
    console.log('\n');
  }

  /**
   * In tổng quan toàn bộ thời gian
   */
  static printOverview(
    tongtienhang: number,
    tongDonHang: number,
    tongSanPhamDaMua: number,
    tongTienTietKiem: number,
    assessment: string
  ): void {
    console.log('%c' + assessment, 'font-size:26px; font-weight: bold;');
    console.log('\n');
    
    console.log('%c🔥 TỔNG QUAN TOÀN BỘ THỜI GIAN', 'font-size: 22px; color: #ff9800; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '%c💰 Tổng chi tiêu: ' + '%c' + formatPrice(tongtienhang) + ' vnđ',
      'font-size: 20px;',
      'font-size: 26px; color: #f44336; font-weight: bold;'
    );
    console.log(
      '%c📦 Tổng đơn hàng: ' + '%c' + formatPrice(tongDonHang) + ' đơn',
      'font-size: 18px;',
      'font-size: 20px; color: #4caf50; font-weight: bold;'
    );
    console.log(
      '%c🛍️ Tổng sản phẩm: ' + '%c' + formatPrice(tongSanPhamDaMua) + ' sản phẩm',
      'font-size: 18px;',
      'font-size: 20px; color: #2196f3; font-weight: bold;'
    );
    console.log(
      '%c🎉 Tiết kiệm được: ' + '%c' + formatPrice(tongTienTietKiem) + ' vnđ',
      'font-size: 18px;',
      'font-size: 20px; color: #4caf50; font-weight: bold;'
    );
    console.log('\n');
  }

  /**
   * In thống kê theo khoảng thời gian
   */
  static printTimeBasedStats(
    label: string,
    stats: { tongTien: number; donHang: number; sanPham: number; tienChuaGiam: number }
  ): void {
    const tietKiem = stats.tienChuaGiam - stats.tongTien;
    console.log('%c📅 ' + label + ':', 'font-size: 18px; color: #ff9800; font-weight: bold;');
    console.log('   💰 Chi tiêu: %c' + formatPrice(stats.tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
    console.log('   📦 Đơn hàng: ' + formatPrice(stats.donHang) + ' đơn');
    console.log('   🛍️ Sản phẩm: ' + formatPrice(stats.sanPham) + ' sản phẩm');
    console.log('   🎉 Tiết kiệm: %c' + formatPrice(tietKiem) + ' vnđ', 'color: #4caf50;');
    console.log('');
  }

  /**
   * In thống kê theo năm
   */
  static printYearBasedStats(
    thongKeTheoNam: Record<string, { tongTien: number; donHang: number; sanPham: number; tienChuaGiam: number }>
  ): void {
    console.log('%c📊 THỐNG KÊ CHI TIÊU THEO NĂM', 'font-size: 22px; color: #9c27b0; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const sortedYears = Object.keys(thongKeTheoNam).sort((a, b) => Number(b) - Number(a));
    
    sortedYears.forEach(year => {
      const data = thongKeTheoNam[year];
      const tietKiemNam = data.tienChuaGiam - data.tongTien;
      console.log('%c🗓️ NĂM ' + year + ':', 'font-size: 18px; color: #ff9800; font-weight: bold;');
      console.log('   💰 Chi tiêu: %c' + formatPrice(data.tongTien) + ' vnđ', 'color: #f44336; font-weight: bold;');
      console.log('   📦 Đơn hàng: ' + formatPrice(data.donHang) + ' đơn');
      console.log('   🛍️ Sản phẩm: ' + formatPrice(data.sanPham) + ' sản phẩm');
      console.log('   🎉 Tiết kiệm: %c' + formatPrice(tietKiemNam) + ' vnđ', 'color: #4caf50;');
      console.log('');
    });
  }
}
