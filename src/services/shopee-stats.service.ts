import type {
  ShopeeOrderResponse,
  ShopeeOrder,
  Statistics,
  ProgressCallback
} from '@/types/shopee';
import { getOrderTime } from '@/utils/format';
import { ConsoleReporter } from '@/utils/console-reporter';
import { getSpendingAssessment } from '@/utils/format';

export class ShopeeStatsService {
  private static readonly API_URL = 'https://shopee.vn/api/v4/order/get_order_list';
  private static readonly PAGE_SIZE = 20;
  private static readonly PRICE_DIVIDER = 100000;

  private statistics: Statistics = {
    tongDonHang: 0,
    tongTienTietKiem: 0,
    tongtienhang: 0,
    tongtienhangchuagiam: 0,
    tongSanPhamDaMua: 0,
    thongKeTheoThang: {
      '1_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
      '3_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
      '6_thang': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 },
      '1_nam': { tongTien: 0, donHang: 0, sanPham: 0, tienChuaGiam: 0 }
    },
    thongKeTheoNam: {}
  };

  /**
   * Lấy danh sách đơn hàng từ Shopee API
   */
  private async fetchOrders(offset: number, limit: number): Promise<ShopeeOrder[]> {
    const url = `${ShopeeStatsService.API_URL}?list_type=3&offset=${offset}&limit=${limit}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ShopeeOrderResponse = await response.json();
      return data.data.details_list || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Không thể lấy dữ liệu. Vui lòng đảm bảo bạn đã đăng nhập Shopee.');
    }
  }

  /**
   * Xử lý một đơn hàng và cập nhật thống kê
   */
  private processOrder(order: ShopeeOrder, dateRanges: {
    oneMonthAgo: Date;
    threeMonthsAgo: Date;
    sixMonthsAgo: Date;
    oneYearAgo: Date;
  }): void {
    const orderTime = getOrderTime(order);
    const orderYear = orderTime.getFullYear().toString();

    // Tính tổng tiền đơn hàng (đã giảm giá)
    const tongTienDonHang = order.info_card.final_total / ShopeeStatsService.PRICE_DIVIDER;
    this.statistics.tongtienhang += tongTienDonHang;

    let tongTienChuaGiamDonHang = 0;
    let soSanPhamDonHang = 0;

    // Duyệt qua từng sản phẩm trong đơn hàng
    order.info_card.order_list_cards.forEach(item => {
      item.product_info.item_groups.forEach(itemGroup => {
        itemGroup.items.forEach(product => {
          const productPrice = product.order_price / ShopeeStatsService.PRICE_DIVIDER;
          soSanPhamDonHang += product.amount;
          this.statistics.tongSanPhamDaMua += product.amount;
          tongTienChuaGiamDonHang += productPrice;
          this.statistics.tongtienhangchuagiam += productPrice;
        });
      });
    });

    // Cập nhật thống kê theo thời gian gần đây
    if (orderTime >= dateRanges.oneMonthAgo) {
      this.updateTimeBasedStats('1_thang', tongTienDonHang, soSanPhamDonHang, tongTienChuaGiamDonHang);
    }
    if (orderTime >= dateRanges.threeMonthsAgo) {
      this.updateTimeBasedStats('3_thang', tongTienDonHang, soSanPhamDonHang, tongTienChuaGiamDonHang);
    }
    if (orderTime >= dateRanges.sixMonthsAgo) {
      this.updateTimeBasedStats('6_thang', tongTienDonHang, soSanPhamDonHang, tongTienChuaGiamDonHang);
    }
    if (orderTime >= dateRanges.oneYearAgo) {
      this.updateTimeBasedStats('1_nam', tongTienDonHang, soSanPhamDonHang, tongTienChuaGiamDonHang);
    }

    // Cập nhật thống kê theo năm
    if (!this.statistics.thongKeTheoNam[orderYear]) {
      this.statistics.thongKeTheoNam[orderYear] = {
        tongTien: 0,
        donHang: 0,
        sanPham: 0,
        tienChuaGiam: 0
      };
    }

    this.statistics.thongKeTheoNam[orderYear].tongTien += tongTienDonHang;
    this.statistics.thongKeTheoNam[orderYear].donHang += 1;
    this.statistics.thongKeTheoNam[orderYear].sanPham += soSanPhamDonHang;
    this.statistics.thongKeTheoNam[orderYear].tienChuaGiam += tongTienChuaGiamDonHang;
  }

  /**
   * Cập nhật thống kê theo khoảng thời gian
   */
  private updateTimeBasedStats(
    period: '1_thang' | '3_thang' | '6_thang' | '1_nam',
    tongTien: number,
    sanPham: number,
    tienChuaGiam: number
  ): void {
    this.statistics.thongKeTheoThang[period].tongTien += tongTien;
    this.statistics.thongKeTheoThang[period].donHang += 1;
    this.statistics.thongKeTheoThang[period].sanPham += sanPham;
    this.statistics.thongKeTheoThang[period].tienChuaGiam += tienChuaGiam;
  }

  /**
   * Thu thập và phân tích toàn bộ đơn hàng
   */
  async collectStatistics(onProgress?: ProgressCallback): Promise<Statistics> {
    console.log('🚀 Bắt đầu thống kê chi tiêu Shopee...');

    let offset = 0;
    let hasMoreOrders = true;

    // Tính toán các mốc thời gian
    const now = new Date();
    const dateRanges = {
      oneMonthAgo: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      threeMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      sixMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      oneYearAgo: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    };

    try {
      while (hasMoreOrders) {
        console.log(`🔄 Lấy đơn hàng từ offset ${offset}...`);
        const orders = await this.fetchOrders(offset, ShopeeStatsService.PAGE_SIZE);
        console.log(`🔍 Lấy được ${orders.length} đơn hàng từ offset ${offset}.`);
        if (orders.length === 0) {
          break;
        }

        this.statistics.tongDonHang += orders.length;
        hasMoreOrders = orders.length >= ShopeeStatsService.PAGE_SIZE;

        // Xử lý từng đơn hàng
        orders.forEach(order => this.processOrder(order, dateRanges));

        // Callback progress
        if (onProgress) {
          onProgress(this.statistics.tongDonHang, -1);
        }

        // Gửi message progress (qua window.postMessage vì MAIN world)
        try {
          window.postMessage({
            type: 'SHOPEE_STATS_PROGRESS',
            message: `Đã xử lý ${this.statistics.tongDonHang} đơn hàng...`
          }, '*');
        } catch (e) {
          // Ignore errors
        }

        console.log(`Đã thống kê được: ${this.statistics.tongDonHang} đơn hàng. ${hasMoreOrders ? 'Đang lấy thêm dữ liệu....' : 'Hoàn thành!'}`);

        offset += ShopeeStatsService.PAGE_SIZE;
      }

      // Tính tổng tiền tiết kiệm
      this.statistics.tongTienTietKiem = 
        this.statistics.tongtienhangchuagiam - this.statistics.tongtienhang;

      return this.statistics;
    } catch (error) {
      console.error('Error collecting statistics:', error);
      throw error;
    }
  }

  /**
   * Hiển thị báo cáo thống kê ra console
   */
  displayReport(): void {
    const assessment = getSpendingAssessment(this.statistics.tongtienhang);

    // Header
    ConsoleReporter.printHeader();

    // Tổng quan
    ConsoleReporter.printOverview(
      this.statistics.tongtienhang,
      this.statistics.tongDonHang,
      this.statistics.tongSanPhamDaMua,
      this.statistics.tongTienTietKiem,
      assessment
    );

    // Thống kê theo thời gian gần đây
    console.log('%c⏰ THỐNG KÊ THEO THỜI GIAN GẦN ĐÂY', 'font-size: 22px; color: #2196f3; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    ConsoleReporter.printTimeBasedStats('1 THÁNG GẦN NHẤT', this.statistics.thongKeTheoThang['1_thang']);
    ConsoleReporter.printTimeBasedStats('3 THÁNG GẦN NHẤT', this.statistics.thongKeTheoThang['3_thang']);
    ConsoleReporter.printTimeBasedStats('6 THÁNG GẦN NHẤT', this.statistics.thongKeTheoThang['6_thang']);
    ConsoleReporter.printTimeBasedStats('1 NĂM GẦN NHẤT', this.statistics.thongKeTheoThang['1_nam']);
    
    console.log('\n');

    // Thống kê theo năm
    ConsoleReporter.printYearBasedStats(this.statistics.thongKeTheoNam);
  }

  /**
   * Lấy thống kê hiện tại
   */
  getStatistics(): Statistics {
    return this.statistics;
  }
}
