/**
 * Format a number as Vietnamese currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  /**
   * Format a price (alias for formatCurrency)
   * @param {number} price - The price to format
   * @returns {string} Formatted currency string
   */
  export const formatPrice = (price) => {
    return formatCurrency(price);
  };
  
  /**
   * Format a date to Vietnamese locale format
   * @param {string|Date} date - The date to format
   * @returns {string} Formatted date string
   */
  export const formatDate = (date) => {
    try {
      if (!date) return 'N/A';
      
      // Handle different date formats
      let dateObj;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        return 'N/A';
      }
  
      // Check if valid date
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
  
      return dateObj.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'N/A';
    }
  };