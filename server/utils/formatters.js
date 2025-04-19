// Hàm định dạng số tiền thành chuỗi tiền tệ Việt Nam đồng (VND)
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { // Sử dụng định dạng ngôn ngữ và khu vực của Việt Nam
      style: 'currency', // Định dạng kiểu tiền tệ
      currency: 'VND' // Đơn vị tiền tệ là đồng Việt Nam
    }).format(amount); // Định dạng số tiền theo thiết lập
  };