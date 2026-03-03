// Shopee API Types
export interface ShopeeOrderResponse {
  data: {
    details_list: ShopeeOrder[];
  };
}

export interface ShopeeOrder {
  info_card: {
    final_total: number;
    order_list_cards: OrderListCard[];
  };
  shipping?: {
    tracking_info: {
      ctime: number;
    };
  };
}

export interface OrderListCard {
  product_info: {
    item_groups: ItemGroup[];
  };
}

export interface ItemGroup {
  items: OrderItem[];
}

export interface OrderItem {
  order_price: number;
  amount: number;
}

// Statistics Types
export interface TimeBasedStats {
  tongTien: number;
  donHang: number;
  sanPham: number;
  tienChuaGiam: number;
}

export interface MonthlyStats {
  [month: string]: TimeBasedStats; // month: '1', '2', ..., '12'
}

export interface YearStats {
  total: TimeBasedStats;
  months: MonthlyStats;
}

export interface YearBasedStats {
  [year: string]: YearStats;
}

export interface Statistics {
  tongDonHang: number;
  tongTienTietKiem: number;
  tongtienhang: number;
  tongtienhangchuagiam: number;
  tongSanPhamDaMua: number;
  thongKeTheoThang: {
    '1_thang': TimeBasedStats;
    '3_thang': TimeBasedStats;
    '6_thang': TimeBasedStats;
    '1_nam': TimeBasedStats;
  };
  thongKeTheoNam: YearBasedStats;
}

// Message Types
export type MessageType = 'progress' | 'complete' | 'error';

export interface ChromeMessage {
  type: MessageType;
  message?: string;
  data?: Partial<Statistics>;
}

export interface ProgressCallback {
  (current: number, total: number): void;
}
