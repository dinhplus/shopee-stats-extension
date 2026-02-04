/**
 * Format số thành chuỗi có dấu phẩy phân cách
 * @param number - Số cần format
 * @param fixed - Số chữ số thập phân (mặc định 0)
 * @returns Chuỗi đã được format (vd: 1,000,000)
 */
export function formatPrice(number: number, fixed: number = 0): string {
  if (isNaN(number)) return '0';
  
  let formattedNumber = number.toFixed(fixed);
  const delimiter = ',';
  const rgx = /(\d+)(\d{3})/;
  
  while (rgx.test(formattedNumber)) {
    formattedNumber = formattedNumber.replace(rgx, '$1' + delimiter + '$2');
  }
  
  return formattedNumber;
}

/**
 * Lấy thời gian đặt hàng từ order object
 * @param order - Shopee order object
 * @returns Date object
 */
export function getOrderTime(order: any): Date {
  return new Date(order.shipping.tracking_info.ctime * 1000);
}

/**
 * Đánh giá mức độ nghiện Shopee dựa trên tổng chi tiêu
 * @param totalSpending - Tổng chi tiêu
 * @returns Thông báo đánh giá
 */
export function getSpendingAssessment(totalSpending: number): string {
  if (totalSpending <= 10000000) {
    return 'HÊN QUÁ! BẠN CHƯA BỊ SHOPEE GÂY NGHIỆN 😍';
  } else if (totalSpending > 10000000 && totalSpending <= 50000000) {
    return 'THÔI XONG! BẠN BẮT ĐẦU NGHIỆN SHOPEE RỒI 😂';
  } else if (totalSpending > 50000000 && totalSpending < 80000000) {
    return 'ỐI GIỜI ƠI! BẠN LÀ CON NGHIỆN SHOPEE CHÍNH HIỆU 😱';
  } else {
    return 'XÓA APP SHOPEE THÔI! BẠN NGHIỆN SHOPEE NẶNG QUÁ RỒI 😝';
  }
}
