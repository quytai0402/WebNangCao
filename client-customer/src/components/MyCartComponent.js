import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaTrash, FaArrowLeft, FaCreditCard, FaMinus, FaPlus, FaLeaf } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import '../styles/MyCartComponent.css';

class MyCart extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
      redirectToCheckout: false
    };
  }
  

  componentDidMount() {
    // Load cart from localStorage if available
    const cart = localStorage.getItem('cart');
    if (cart) {
      const cartItems = JSON.parse(cart);
      this.setState({ 
        items: cartItems,
        totalQuantity: this.calculateTotalQuantity(cartItems),
        totalAmount: this.calculateTotalAmount(cartItems)
      });
    }
  }

  // Tính tổng số lượng của các sản phẩm
  calculateTotalQuantity(items) {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  // Đếm số lượng mặt hàng khác nhau (sản phẩm)
  countUniqueItems(items) {
    return items.length;
  }

  calculateTotalAmount(items) {
    return items.reduce((total, item) => total + (item.quantity * item.product.price), 0);
  }

  // Update quantity of an item in cart
  updateQuantity = (index, quantity) => {
    const items = [...this.state.items];
    
    if (quantity <= 0) {
      items.splice(index, 1); // Remove item if quantity is zero or negative
    } else {
      items[index].quantity = quantity;
    }
    
    // Update localStorage and state
    localStorage.setItem('cart', JSON.stringify(items));
    this.setState({ 
      items: items,
      totalQuantity: this.calculateTotalQuantity(items),
      totalAmount: this.calculateTotalAmount(items)
    });
  };

  // Remove an item from cart
  removeItem = (index) => {
    const items = [...this.state.items];
    items.splice(index, 1);
    
    // Update localStorage and state
    localStorage.setItem('cart', JSON.stringify(items));
    this.setState({ 
      items: items,
      totalQuantity: this.calculateTotalQuantity(items),
      totalAmount: this.calculateTotalAmount(items)
    });
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  // Clear cart
  clearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      localStorage.removeItem('cart');
      this.setState({ 
        items: [], 
        totalQuantity: 0, 
        totalAmount: 0
      });
      toast.info('Đã xóa toàn bộ giỏ hàng');
    }
  };
  
  // Proceed to checkout
  proceedToCheckout = () => {
    if (this.state.items.length === 0) {
      toast.warning('Giỏ hàng của bạn đang trống');
      return;
    }
    
    // Set flag to indicate checkout is from cart and ensure buyNow items are ignored
    localStorage.setItem('checkoutFromCart', 'true');
    
    // Remove any buyNow items to avoid conflicts
    localStorage.removeItem('buyNowItems');
    
    // Redirect to checkout page
    this.setState({ redirectToCheckout: true });
  };

  formatCurrency(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);
  }

  renderProductImage(product) {
    if (!product.image) return '/images/default-product.png';
    
    if (product.image.startsWith('http') || product.image.startsWith('data:')) {
      return product.image;
    } else {
      return `data:image/jpeg;base64,${product.image}`;
    }
  }

  // Add shipping fee calculation method
  calculateShippingFee(subtotal) {
    return 0;
  }

  render() {
    const { items, totalQuantity, totalAmount, redirectToCheckout } = this.state;
    const uniqueItemsCount = this.countUniqueItems(items); 

    if (redirectToCheckout) {
      return <Navigate to="/checkout" />;
    }

    // Calculate shipping fee
    const shippingFee = this.calculateShippingFee(totalAmount);
    const finalTotal = totalAmount + shippingFee;

    return (
      <div className="flower-cart-container">
        <div className="flower-cart-header">
          <div className="flower-cart-title">
            <GiFlowerPot className="flower-cart-icon" />
            <div>
              <h2>Giỏ Hàng Của Bạn</h2>
              <p>{uniqueItemsCount} sản phẩm trong giỏ hàng ({totalQuantity} mặt hàng)</p>
            </div>
          </div>
          <div className="flower-decoration">
            <span>🌸</span>
            <span>🌿</span>
            <span>🌹</span>
          </div>
        </div>
        
        {items.length === 0 ? (
          <div className="flower-empty-cart">
            <div className="flower-empty-cart-icon">
              <FaShoppingCart />
            </div>
            <h3>Giỏ hàng của bạn đang trống</h3>
            <p>Hãy thêm những bó hoa tươi đẹp vào giỏ hàng của bạn</p>
            <Link to="/products?type=all=true" className="flower-btn-continue-shopping">
              <FaArrowLeft /> Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="flower-cart-content">
            <div className="flower-cart-items">
              <div className="flower-cart-items-header">
                <div className="flower-cart-header-product">Sản phẩm</div>
                <div className="flower-cart-header-price">Giá</div>
                <div className="flower-cart-header-quantity">Số lượng</div>
                <div className="flower-cart-header-subtotal">Thành tiền</div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flower-cart-item" style={{"--animation-order": index}}>
                  <div className="flower-cart-item-product">
                    <div className="flower-cart-item-image">
                      <img 
                        src={this.renderProductImage(item.product)} 
                        alt={item.product.name}
                        onError={(e) => {e.target.src = "/images/default-product.png"}} 
                      />
                    </div>
                    <div className="flower-cart-item-details">
                      <h4 className="flower-cart-item-name">{item.product.name}</h4>
                      {item.product.category && (
                        <div className="flower-cart-item-category">
                          <FaLeaf className="category-icon" /> {item.product.category.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flower-cart-item-price">
                    {this.formatCurrency(item.product.price)}
                  </div>
                  
                  <div className="flower-cart-item-quantity">
                    <button 
                      className="flower-quantity-btn minus"
                      onClick={() => this.updateQuantity(index, item.quantity - 1)}
                    >
                      <FaMinus />
                    </button>
                    <input 
                      type="text" 
                      value={item.quantity}
                      readOnly 
                      className="flower-quantity-input"
                    />
                    <button 
                      className="flower-quantity-btn plus"
                      onClick={() => this.updateQuantity(index, item.quantity + 1)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <div className="flower-cart-item-subtotal">
                    <span>{this.formatCurrency(item.product.price * item.quantity)}</span>
                    <button 
                      className="flower-cart-item-remove"
                      onClick={() => this.removeItem(index)}
                      title="Xóa sản phẩm"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flower-cart-items-footer">
                <button 
                  className="flower-btn-clear-cart"
                  onClick={this.clearCart}
                >
                  <FaTrash /> Xóa giỏ hàng
                </button>
                <Link to="/products" className="flower-btn-continue">
                  <FaArrowLeft /> Tiếp tục mua sắm
                </Link>
              </div>
            </div>
            
            <div className="flower-cart-summary">
              <h3>Tổng đơn hàng</h3>
              
              <div className="flower-summary-content">
                <div className="flower-summary-row">
                  <span>Số lượng sản phẩm:</span>
                  <span>{uniqueItemsCount} sản phẩm</span>
                </div>
                
                <div className="flower-summary-row">
                  <span>Tổng số lượng:</span>
                  <span>{totalQuantity} mặt hàng</span>
                </div>
                
                <div className="flower-summary-row">
                  <span>Tạm tính:</span>
                  <span>{this.formatCurrency(totalAmount)}</span>
                </div>
                
                <div className="flower-summary-footer">
                  <div className="flower-summary-row shipping">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {shippingFee > 0 
                        ? this.formatCurrency(shippingFee) 
                        : 'Miễn phí'}
                    </span>
                  </div>
                  
                  <div className="flower-summary-row total">
                    <span>Thành tiền:</span>
                    <span>{this.formatCurrency(finalTotal)}</span>
                  </div>
                  
                  <button 
                    className="flower-btn-checkout"
                    onClick={this.proceedToCheckout}
                  >
                    <FaCreditCard /> Tiến hành thanh toán
                  </button>
                  
                  <div className="flower-checkout-note">
                    <p>Miễn phí giao hàng cho tất cả đơn hàng</p>
                    <p>Thời gian giao hàng: 1-2 ngày làm việc</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MyCart;