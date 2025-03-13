
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', 
      currency: 'VND'
    }).format(amount);
  };
  
  export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };