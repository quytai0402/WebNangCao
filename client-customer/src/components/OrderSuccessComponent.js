import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import { 
  FaCheckCircle, FaPrint, FaShoppingCart,
  FaBoxOpen, FaMoneyBillWave, FaCreditCard, FaUser, 
  FaPhone, FaMapMarkerAlt, FaEnvelope, FaTruck,
  FaCalendarAlt, FaClipboardCheck, FaShippingFast,
  FaGift
} from 'react-icons/fa';
import '../styles/OrderSuccessComponent.css';

class OrderSuccessComponent extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      order: null,
      loading: true,
      error: null,
      printMode: false,
      animationComplete: false,
      trackingProgress: 0,
      showConfetti: true,
      expandedAddress: false
    };
  }

  componentDidMount() {
    this.loadOrderData();
    this.clearCart();
    
    // Animation timing
    setTimeout(() => {
      this.setState({ animationComplete: true });
    }, 1000);

    // Hide confetti after 5 seconds
    setTimeout(() => {
      this.setState({ showConfetti: false });
    }, 5000);

    // Simulate loading tracking progress
    this.startTrackingProgressAnimation();
  }

  startTrackingProgressAnimation = () => {
    // Giả lập tiến trình theo dõi đơn hàng cho hiệu ứng động
    const interval = setInterval(() => {
      this.setState(prevState => {
        const newProgress = prevState.trackingProgress + 1;
        if (newProgress >= 25) { // Với 25% là trạng thái đặt hàng thành công
          clearInterval(interval);
        }
        return { trackingProgress: Math.min(newProgress, 25) };
      });
    }, 20);
  }

  loadOrderData = () => {
    try {
      const orderData = localStorage.getItem('lastOrder');
      console.log('Retrieved order data from localStorage:', orderData ? 'Found' : 'Not found');
      
      if (!orderData) {
        throw new Error('Không tìm thấy thông tin đơn hàng');
      }
      
      const parsedOrder = JSON.parse(orderData);
      console.log('Parsed order data:', parsedOrder);
      
      if (!this.validateOrderData(parsedOrder)) {
        throw new Error('Dữ liệu đơn hàng không hợp lệ');
      }
      
      this.setState({ 
        order: parsedOrder, 
        loading: false 
      });
    } catch (error) {
      console.error('Error loading order data:', error);
      this.setState({ 
        error: error.message || 'Không thể đọc thông tin đơn hàng',
        loading: false
      });
    }
  }

  validateOrderData = (order) => {
    // Kiểm tra đơn hàng một cách chi tiết, với log để debug
    console.log('Validating order data:', order);
    
    const isValid = order && 
      order.items && 
      Array.isArray(order.items) && 
      order.customerInfo &&
      (order._id || order.orderNumber); 
    
    console.log('Order validation result:', isValid);
    
    if (!isValid) {
      console.log('Order validation failed details:', {
        hasOrder: !!order,
        hasItems: order && !!order.items,
        isItemsArray: order && order.items && Array.isArray(order.items),
        hasCustomerInfo: order && !!order.customerInfo,
        hasID: order && (!!order._id || !!order.orderNumber)
      });
    }
    
    return isValid;
  }

  clearCart = () => {
    if (this.context.setCartItems) {
      this.context.setCartItems([]);
      localStorage.removeItem('cart');
      localStorage.removeItem('discount');
      localStorage.removeItem('giftWrap');
      localStorage.removeItem('giftMessage');
    }
  }

  formatCurrency = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }

  renderProductImage = (product) => {
    if (!product || !product.image) return '/images/default-product.png';
    
    return product.image.startsWith('http') || product.image.startsWith('data:')
      ? product.image
      : `data:image/jpeg;base64,${product.image}`;
  }

  printOrder = () => {
    this.setState({ printMode: true }, () => {
      window.print();
      this.setState({ printMode: false });
    });
  }

  handleImageError = (event) => {
    event.target.src = "/images/default-product.png";
    event.target.onerror = null;
  }

  getOrderStatus = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao hàng',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || 'Chờ xác nhận';
  }

  renderLoadingState = () => (
    <div className="order-success-loading">
      <div className="order-success-spinner"></div>
      <p>Đang tải thông tin đơn hàng...</p>
    </div>
  );

  renderErrorState = () => (
    <div className="order-success-container order-success-error">
      <h2>Có lỗi xảy ra</h2>
      <p>{this.state.error || 'Không tìm thấy thông tin đơn hàng'}</p>
      <div className="order-success-actions">
        <Link to="/products" className="order-success-button order-success-continue">
          <FaShoppingCart /> Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );

  renderDeliveryProgress = () => {
    const { order } = this.state;
    const status = order.status || 'pending';
    const progressPercentage = this.getProgressPercentage(status);
    
    // Các bước giao hàng
    const steps = [
      { id: 'pending', label: 'Đặt hàng', icon: <FaClipboardCheck /> },
      { id: 'confirmed', label: 'Xác nhận', icon: <FaCalendarAlt /> },
      { id: 'shipping', label: 'Đang giao', icon: <FaShippingFast /> },
      { id: 'completed', label: 'Hoàn thành', icon: <FaTruck /> }
    ];
    
    // Lấy index của bước hiện tại
    const currentStepIndex = steps.findIndex(step => step.id === status);
    const isActive = (index) => {
      if (status === 'cancelled') return false;
      return index <= currentStepIndex;
    };
    
    return (
      <div className="flower-delivery-progress">
        <div className="flower-progress-track">
          <div 
            className="flower-progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="flower-delivery-steps">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flower-step ${isActive(index) ? 'active' : ''}`}
            >
              <div className="flower-step-icon">
                {step.icon}
              </div>
              <div className="flower-step-label">{step.label}</div>
            </div>
          ))}
        </div>
        
        {status === 'cancelled' && (
          <div className="flower-cancelled-message">
            <FaBoxOpen /> Đơn hàng đã bị hủy
          </div>
        )}
      </div>
    );
  }
  
  getProgressPercentage = (status) => {
    const statusMap = {
      'pending': 25,
      'confirmed': 50,
      'shipping': 75,
      'completed': 100,
      'cancelled': 0
    };
    return statusMap[status] || 0;
  }

  renderOrderSummary = () => {
    const { order } = this.state;
    return (
      <div className="flower-order-info-card">
        <div className="flower-card-header">
          <div className="flower-card-icon">
            <FaClipboardCheck />
          </div>
          <h3>Thông tin đơn hàng</h3>
        </div>
        <div className="flower-card-content">
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaCalendarAlt /></span>
              Mã đơn hàng:
            </div>
            <div className="flower-info-value">
              <span className="flower-order-id">#{order._id}</span>
            </div>
          </div>
          
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaCalendarAlt /></span>
              Ngày đặt hàng:
            </div>
            <div className="flower-info-value">
              {this.formatDate(order.orderDate)}
            </div>
          </div>
          
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaClipboardCheck /></span>
              Trạng thái:
            </div>
            <div className="flower-info-value">
              <span className={`flower-order-status status-${order.status || 'pending'}`}>
                {this.getOrderStatus(order.status)}
              </span>
            </div>
          </div>
          
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon">
                {order.paymentMethod === 'cash' ? <FaMoneyBillWave /> : <FaCreditCard />}
              </span>
              Phương thức thanh toán:
            </div>
            <div className="flower-info-value">
              <div className="flower-payment-method">
                {order.paymentMethod === 'cash' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  toggleAddressExpand = () => {
    this.setState(prevState => ({
      expandedAddress: !prevState.expandedAddress
    }));
  }

  renderCustomerInfo = () => {
    const { order, expandedAddress } = this.state;
    return (
      <div className="flower-order-info-card">
        <div className="flower-card-header">
          <div className="flower-card-icon">
            <FaUser />
          </div>
          <h3>Thông tin người nhận</h3>
        </div>
        <div className="flower-card-content">
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaUser /></span>
              Họ tên:
            </div>
            <div className="flower-info-value">
              {order.customerInfo.name}
            </div>
          </div>
          
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaPhone /></span>
              Số điện thoại:
            </div>
            <div className="flower-info-value">
              {order.customerInfo.phone}
            </div>
          </div>
          
          {order.customerInfo.email && (
            <div className="flower-info-row">
              <div className="flower-info-label">
                <span className="flower-info-icon"><FaEnvelope /></span>
                Email:
              </div>
              <div className="flower-info-value">
                {order.customerInfo.email}
              </div>
            </div>
          )}
          
          <div className="flower-info-row">
            <div className="flower-info-label">
              <span className="flower-info-icon"><FaMapMarkerAlt /></span>
              Địa chỉ:
            </div>
            <div className="flower-info-value">
              {this.isLongAddress(order.customerInfo.address) && !expandedAddress ? (
                <div 
                  className="flower-address-marquee"
                  onClick={this.toggleAddressExpand}
                  title="Nhấn để xem đầy đủ địa chỉ"
                >
                  <div className="marquee-content">
                    {order.customerInfo.address}
                  </div>
                </div>
              ) : (
                <div 
                  className={`flower-address ${expandedAddress ? 'expanded' : ''}`}
                  onClick={this.isLongAddress(order.customerInfo.address) ? this.toggleAddressExpand : undefined}
                >
                  {order.customerInfo.address}
                  {expandedAddress && (
                    <div className="address-collapse-hint">Nhấn để thu gọn</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {order.note && (
            <div className="flower-note">
              <h4>Ghi chú</h4>
              <p>{order.note}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  isLongAddress = (address) => {
    return address && address.length > 60;
  }

  render() {
    const { order, loading, error, printMode, animationComplete, showConfetti } = this.state;

    if (loading) return this.renderLoadingState();
    if (error || !order) return this.renderErrorState();
    
    const animationClass = animationComplete ? 'animation-complete' : '';
    const confettiClass = showConfetti ? 'show-confetti' : '';

    return (
      <div className={`flower-order-success-container${printMode ? ' print-mode' : ''} ${animationClass} ${confettiClass}`}>
        {showConfetti && this.renderConfetti()}
        
        <div className="flower-success-header">
          <div className="flower-success-icon">
            <FaCheckCircle size={80} />
          </div>
          <h1>Đặt hàng thành công!</h1>
          <p className="flower-thankyou-message">
            Cảm ơn quý khách đã tin tưởng và lựa chọn Flower Shop. Đơn hàng của quý khách đang được xử lý. Chúng tôi sẽ liên hệ sớm nhất để xác nhận và giao hàng đến tận tay quý khách.
          </p>
          
          <div className="flower-order-number-badge">
            Mã đơn hàng: <span>#{order._id}</span>
          </div>
        </div>

        {/* Progress tracking */}
        {this.renderDeliveryProgress()}

        <div className="flower-order-info-section">
          <div className="flower-order-info-grid">
            {this.renderOrderSummary()}
            {this.renderCustomerInfo()}
          </div>
        </div>

        <div className="flower-order-products">
          <div className="flower-product-section-header">
            <div className="flower-section-icon">
              <FaShoppingCart />
            </div>
            <h2>Sản phẩm đã mua</h2>
          </div>
          
          <div className="flower-product-list">
            {order.items.map((item, index) => (
              <div key={index} className="flower-product-card">
                <div className="flower-product-image">
                  <img 
                    src={this.renderProductImage(item.product)} 
                    alt={item.product.name}
                    onError={this.handleImageError}
                  />
                </div>
                
                <div className="flower-product-details">
                  <h3 className="flower-product-name">{item.product.name}</h3>
                  <div className="flower-product-info">
                    <div className="flower-product-price">
                      {this.formatCurrency(item.product.price)}
                    </div>
                    <div className="flower-product-quantity-container">
                      <span className="quantity-label">Số lượng:</span>
                      <span className="quantity-value">{item.quantity}</span>
                    </div>
                  </div>
                  {item.customization && (
                    <div className="flower-product-customization">
                      <FaGift className="customization-icon" /> {item.customization}
                    </div>
                  )}
                </div>
                
                <div className="flower-product-subtotal">
                  {this.formatCurrency(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="flower-order-summary">
            <div className="flower-summary-row">
              <span>Tạm tính:</span>
              <span>{this.formatCurrency(order.totalAmount)}</span>
            </div>
            
            {order.discount > 0 && (
              <div className="flower-summary-row flower-discount">
                <span>Giảm giá:</span>
                <span>- {this.formatCurrency(order.discount)}</span>
              </div>
            )}
            
            {order.giftWrap && (
              <div className="flower-summary-row">
                <span><FaGift className="summary-icon" /> Gói quà tặng:</span>
                <span>{this.formatCurrency(20000)}</span>
              </div>
            )}
            
            <div className="flower-summary-row flower-shipping">
              <span><FaTruck className="summary-icon" /> Phí vận chuyển:</span>
              <span>
                {order.shippingFee === 0 
                  ? 'Miễn phí' 
                  : this.formatCurrency(order.shippingFee)}
              </span>
            </div>
            
            <div className="flower-summary-row flower-total">
              <span>Tổng cộng:</span>
              <span>{this.formatCurrency(order.finalTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flower-order-actions">
          <button onClick={this.printOrder} className="flower-action-button flower-print-button">
            <FaPrint /> In đơn hàng
          </button>
          <Link to="/products" className="flower-action-button flower-continue-button">
            <FaShoppingCart /> Tiếp tục mua sắm
          </Link>
          <Link to="/my-orders" className="flower-action-button flower-track-button">
            <FaBoxOpen /> Theo dõi đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  renderConfetti() {
    return (
      <div className="flower-confetti-container">
        {Array.from({ length: 50 }).map((_, index) => (
          <div 
            key={index} 
            className="flower-confetti-piece" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              backgroundColor: index % 5 === 0 ? '#f27999' : 
                               index % 5 === 1 ? '#ffde59' : 
                               index % 5 === 2 ? '#83c5be' : 
                               index % 5 === 3 ? '#ffd1dd' : '#6a994e'
            }}
          />
        ))}
      </div>
    );
  }
}

export default OrderSuccessComponent;