import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MyContext from '../contexts/MyContext';
import '../styles/MyOrdersComponent.css';
import {
    FaShoppingBag, FaEye, FaTimes, FaCalendar,
    FaMoneyBillWave, FaTruck, FaCheck, FaSpinner,
    FaShoppingCart, FaUser, FaPhoneAlt,
    FaMapMarkerAlt, FaBoxOpen, FaClipboardList, FaBan, FaFileInvoice, FaFilter,
    FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight
} from 'react-icons/fa';

class MyOrders extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: null,
            selectedOrder: null,
            showOrderDetails: false,
            currentPage: 1,
            ordersPerPage: 10,
            activeFilter: 'all'
        };
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        const customerStr = localStorage.getItem('customer');

        if (token && customerStr) {
            const customer = JSON.parse(customerStr);
            this.context.setToken(token);
            this.context.setCustomer(customer);
            this.loadOrders();
        } else {
            this.setState({
                loading: false,
                error: 'Vui lòng đăng nhập để xem đơn hàng'
            });
        }
    }

    loadOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const customerStr = localStorage.getItem('customer');

            if (!token || !customerStr) {
                throw new Error('Vui lòng đăng nhập để xem đơn hàng');
            }

            const customer = JSON.parse(customerStr);
            this.setState({ loading: true, error: null });

            const response = await axios.get(`/api/customer/orders/${customer._id}`, {
                headers: {
                    'x-access-token': token
                }
            });

            if (response.data && response.data.success) {
                let orders = response.data.orders || [];

                if (!Array.isArray(orders)) {
                    console.error('Orders data is not an array:', orders);
                    orders = [];
                }

                orders = orders.sort((a, b) =>
                    new Date(b.date || Date.now()) - new Date(a.date || Date.now())
                );

                this.setState({
                    orders: orders,
                    loading: false,
                    error: null,
                    currentPage: 1 // Reset về trang đầu tiên khi load dữ liệu mới
                });
            } else {
                throw new Error(response.data?.message || 'Không thể tải đơn hàng');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.setState({
                loading: false,
                error: error.message || 'Không thể tải đơn hàng'
            });
        }
    };
    
    handleViewOrderDetail = (order, event) => {
        // Prevent default behavior if an event is passed
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        
        this.setState({
            selectedOrder: order,
            showOrderDetails: true
        });
    };

    closeOrderDetails = () => {
        this.setState({
            showOrderDetails: false
        });
    };

    filterOrders = (filterType) => {
        this.setState({ 
            activeFilter: filterType,
            currentPage: 1 // Reset về trang đầu tiên khi thay đổi bộ lọc
        });
    };

    handlePageChange = (pageNumber) => {
        this.setState({ currentPage: pageNumber });
    };

    // Hàm chuyển đến trang trước
    goToPrevPage = () => {
        const { currentPage } = this.state;
        if (currentPage > 1) {
            this.setState({ currentPage: currentPage - 1 });
        }
    };

    // Hàm chuyển đến trang tiếp theo
    goToNextPage = () => {
        const { currentPage, filteredOrders, ordersPerPage } = this.state;
        const totalPages = Math.ceil(this.getFilteredOrders().length / ordersPerPage);
        if (currentPage < totalPages) {
            this.setState({ currentPage: currentPage + 1 });
        }
    };

    formatCurrency = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    };

    formatDate = (dateString) => {
        try {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };
            return new Date(dateString).toLocaleDateString('vi-VN', options);
        } catch (error) {
            console.error('Date formatting error:', error);
            return dateString;
        }
    };

    getOrderStatus = (status) => {
        const statusMap = {
            'pending': { label: 'Chờ xác nhận', className: 'status-pending' },
            'confirmed': { label: 'Đã xác nhận', className: 'status-confirmed' },
            'processing': { label: 'Đang xử lý', className: 'status-processing' },
            'shipping': { label: 'Đang giao', className: 'status-shipping' },
            'delivered': { label: 'Đã giao', className: 'status-delivered' },
            'cancelled': { label: 'Đã hủy', className: 'status-cancelled' }
        };

        return statusMap[status] || { label: status, className: 'status-pending' };
    };

    renderProductImage = (product) => {
        if (!product || !product.image) return '/images/default-product.png';

        return product.image.startsWith('http') || product.image.startsWith('data:')
            ? product.image
            : `data:image/jpeg;base64,${product.image}`;
    };

    calculateOrderTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;

        const subtotal = items.reduce((total, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            return total + (price * quantity);
        }, 0);

        return subtotal;
    };

    // Calculate final order total including shipping fee
    calculateFinalTotal = (order) => {
        if (!order) return 0;
        
        // If finalTotal is already provided, use it
        if (order.finalTotal) return order.finalTotal;
        
        // If shippingFee is provided, use it
        const subtotal = this.calculateOrderTotal(order.items);
        const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 0;
        
        return subtotal + shippingFee;
    };

    // Trả về các đơn hàng đã được lọc theo trạng thái
    getFilteredOrders = () => {
        const { orders, activeFilter } = this.state;
        
        if (activeFilter === 'all') {
            return orders;
        }
        
        return orders.filter(order => {
            if (activeFilter === 'pending') {
                return order.status === 'pending' || order.status === 'confirmed';
            } else if (activeFilter === 'processing') {
                return order.status === 'processing';
            } else if (activeFilter === 'shipping') {
                return order.status === 'shipping';
            } else {
                return order.status === activeFilter;
            }
        });
    };

    // Trả về các đơn hàng hiện tại trên trang
    getCurrentOrders = () => {
        const { currentPage, ordersPerPage } = this.state;
        const filteredOrders = this.getFilteredOrders();
        
        const indexOfLastOrder = currentPage * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        
        return filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    };

    getProgressBarInfo = (status) => {
        // Cập nhật các bước theo trạng thái của đơn hàng
        const steps = ['pending', 'processing', 'shipping', 'delivered'];
        
        if (status === 'cancelled') {
            return {
                progress: 100,
                currentStep: -1 // Đơn hàng bị hủy không thuộc bước nào
            };
        }
        
        // Gom 'pending' và 'confirmed' vào cùng bước 'Chờ xác nhận'
        let normalizedStatus = status;
        if (status === 'confirmed') {
            normalizedStatus = 'pending';
        }
        
        const currentIndex = steps.indexOf(normalizedStatus);
        if (currentIndex === -1) return { progress: 0, currentStep: 0 };
        
        // Tính phần trăm tiến trình
        const progress = (currentIndex / (steps.length - 1)) * 100;
        
        return {
            progress,
            currentStep: currentIndex
        };
    };

    renderOrderProgress = (status) => {
        const { progress, currentStep } = this.getProgressBarInfo(status);
        
        // Cập nhật các bước theo hình mẫu với icon đẹp hơn
        const steps = [
            { key: 'pending', label: 'Chờ xác nhận', icon: <FaShoppingBag /> },
            { key: 'processing', label: 'Đang xử lý', icon: <FaSpinner /> },
            { key: 'shipping', label: 'Đang giao', icon: <FaTruck /> },
            { key: 'delivered', label: 'Đã giao', icon: <FaCheck /> }
        ];
        
        const isCancelled = status === 'cancelled';
        
        return (
            <div className="order-progress-tracker">
                <div className="order-progress-bar">
                    {!isCancelled && (
                        <div 
                            className="order-progress-bar-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    )}
                    
                    {isCancelled && (
                        <div 
                            className="order-cancelled-bar"
                            style={{ width: '100%' }}
                        ></div>
                    )}
                    
                    {steps.map((step, index) => {
                        let stepClass = '';
                        
                        if (isCancelled) {
                            stepClass = index === 0 ? 'step-cancelled' : '';
                        } else if (index < currentStep) {
                            stepClass = 'step-completed';
                        } else if (index === currentStep) {
                            stepClass = 'step-active';
                        }
                        
                        return (
                            <div 
                                key={step.key} 
                                className={`order-progress-step ${stepClass}`}
                            >
                                <div className="order-step-circle">
                                    <span className="order-step-icon">
                                        {step.icon}
                                    </span>
                                </div>
                                <div className="order-step-label">
                                    {step.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    renderEmptyState() {
        return (
            <div className="my-orders-empty animated fadeIn">
                <div className="empty-icon">
                    <FaShoppingBag />
                </div>
                <h3>Bạn chưa có đơn hàng nào</h3>
                <p>Hãy mua sắm để có những bó hoa tươi đẹp nhất</p>
                <Link to="/products" className="btn-shop-now">
                    <FaShoppingCart /> Mua sắm ngay
                </Link>
            </div>
        );
    }

    renderOrderDetailModal() {
        const { selectedOrder, showOrderDetails } = this.state;
        if (!selectedOrder || !showOrderDetails) return null;
    
        // Xác định phương thức giao hàng
        const deliveryOption = selectedOrder.deliveryOption || 'standard';
        const deliveryText = deliveryOption === 'express' ? 'Giao hàng nhanh' : 'Giao hàng tiêu chuẩn';
    
        return (
            <div className="order-detail-modal animated fadeIn">
                <div className="order-detail-overlay" onClick={this.closeOrderDetails}></div>
                <div className="order-detail-content animated slideInUp">
                    <div className="order-detail-header">
                        <div className="modal-title-wrapper">
                            <div className="modal-icon-container">
                                <FaShoppingBag className="modal-icon" />
                            </div>
                            <h3>
                                Chi tiết đơn hàng <span className="order-id">#{selectedOrder._id}</span>
                            </h3>
                        </div>
                        <button className="close-button" onClick={this.closeOrderDetails} aria-label="Đóng">
                            <FaTimes />
                        </button>
                    </div>
                    
                    {/* Status badge với thiết kế mới */}
                    <div className="order-detail-status-section">
                        <div className={`order-detail-status-badge ${this.getOrderStatus(selectedOrder.status).className}`}>
                            <span className="status-dot"></span>
                            <span className="status-text">{this.getOrderStatus(selectedOrder.status).label}</span>
                        </div>
                        <div className="order-date-display">
                            <FaCalendar className="date-icon" />
                            <span>{this.formatDate(selectedOrder.date)}</span>
                        </div>
                    </div>
                    
                    {/* Progress tracking in modal - hiển thị tiến trình đơn hàng */}
                    <div className="order-detail-progress-section">
                        {this.renderOrderProgress(selectedOrder.status)}
                    </div>
    
                    <div className="order-detail-body">
                        <div className="order-info-sections">
                            {/* Thông tin đơn hàng */}
                            <div className="order-info-section animated fadeInUp" style={{"--delay": "0.2s"}}>
                                <div className="order-info-title">
                                    <div className="section-icon-container">
                                        <FaFileInvoice className="section-icon" />
                                    </div>
                                    <h3>Thông tin đơn hàng</h3>
                                </div>
                                <div className="order-info-content">
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaCalendar /></span> Ngày đặt
                                        </div>
                                        <div className="order-info-value">
                                            {this.formatDate(selectedOrder.date)}
                                        </div>
                                    </div>
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaMoneyBillWave /></span> Tổng tiền
                                        </div>
                                        <div className="order-info-value order-total">
                                            {this.formatCurrency(this.calculateFinalTotal(selectedOrder))}
                                        </div>
                                    </div>
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaTruck /></span> Trạng thái
                                        </div>
                                        <div className="order-info-value">
                                            <span className={`order-status ${this.getOrderStatus(selectedOrder.status).className}`}>
                                                {this.getOrderStatus(selectedOrder.status).label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon">
                                                {selectedOrder.paymentMethod === 'cash' ? <FaMoneyBillWave /> : <FaFileInvoice />}
                                            </span> 
                                            Phương thức thanh toán
                                        </div>
                                        <div className="order-info-value">
                                            {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                                        </div>
                                    </div>
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaBoxOpen /></span> Phương thức giao hàng
                                        </div>
                                        <div className="order-info-value">
                                            {deliveryText}
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            {/* Thông tin người nhận */}
                            {selectedOrder.customerInfo && (
                            <div className="order-info-section animated fadeInUp" style={{"--delay": "0.3s"}}>
                                <div className="order-info-title">
                                    <div className="section-icon-container delivery">
                                        <FaUser className="section-icon" />
                                    </div>
                                    <h3>Thông tin người nhận</h3>
                                </div>
                                <div className="order-info-content">
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaUser /></span> Người nhận
                                        </div>
                                        <div className="order-info-value">{selectedOrder.customerInfo.name}</div>
                                    </div>
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaPhoneAlt /></span> Số điện thoại
                                        </div>
                                        <div className="order-info-value">{selectedOrder.customerInfo.phone}</div>
                                    </div>
                                    {selectedOrder.customerInfo.email && (
                                        <div className="order-info-item">
                                            <div className="order-info-label">
                                                <span className="order-info-small-icon">📧</span> Email
                                            </div>
                                            <div className="order-info-value">{selectedOrder.customerInfo.email}</div>
                                        </div>
                                    )}
                                    <div className="order-info-item">
                                        <div className="order-info-label">
                                            <span className="order-info-small-icon"><FaMapMarkerAlt /></span> Địa chỉ
                                        </div>
                                        <div className="order-info-value address-text">{selectedOrder.customerInfo.address}</div>
                                    </div>
                                    {selectedOrder.note && (
                                        <div className="order-info-item note-container">
                                            <div className="order-info-label">
                                                <span className="order-info-small-icon">📝</span> Ghi chú
                                            </div>
                                            <div className="order-info-value note-text">{selectedOrder.note}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}
                        </div>
    
                        {/* Danh sách sản phẩm */}
                        <div className="order-products animated fadeInUp" style={{"--delay": "0.4s"}}>
                            <div className="order-products-header">
                                <div className="section-icon-container product">
                                    <FaShoppingCart className="section-icon" />
                                </div>
                                <h3>Sản phẩm đã mua</h3>
                            </div>
                            <div className="order-products-list">
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="order-product-item animated fadeInUp" style={{"--delay": `${0.5 + index * 0.05}s`}}>
                                        <div className="order-product-image">
                                            <img
                                                src={this.renderProductImage(item.product)}
                                                alt={item.product.name}
                                                onError={(e) => { e.target.src = '/images/default-product.png' }}
                                            />
                                        </div>
                                        <div className="order-product-details">
                                            <h4 className="order-product-name">{item.product.name}</h4>
                                            <div className="order-product-info">
                                                <div className="order-product-price">
                                                    {this.formatCurrency(item.price)}
                                                </div>
                                                <div className="order-product-quantity-container">
                                                    <span className="quantity-label">Số lượng:</span>
                                                    <span className="quantity-value">{item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-product-subtotal">
                                            {this.formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
    
                            {/* Tổng đơn hàng */}
                            <div className="order-summary-totals">
                                <div className="order-summary-row">
                                    <span>Tạm tính:</span>
                                    <span>{this.formatCurrency(this.calculateOrderTotal(selectedOrder.items))}</span>
                                </div>
                                
                                {selectedOrder.discount > 0 && (
                                    <div className="order-summary-row discount">
                                        <span>Giảm giá:</span>
                                        <span>- {this.formatCurrency(selectedOrder.discount)}</span>
                                    </div>
                                )}
                                
                                {selectedOrder.giftWrap && (
                                    <div className="order-summary-row">
                                        <span>Gói quà tặng:</span>
                                        <span>{this.formatCurrency(20000)}</span>
                                    </div>
                                )}
                                
                                <div className="order-summary-row shipping">
                                    <span>Phí vận chuyển:</span>
                                    <span>
                                        {selectedOrder.shippingFee > 0 
                                            ? this.formatCurrency(selectedOrder.shippingFee) 
                                            : 'Miễn phí'}
                                    </span>
                                </div>
                                
                                <div className="order-summary-row total">
                                    <span>Tổng cộng:</span>
                                    <span>{this.formatCurrency(this.calculateFinalTotal(selectedOrder))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div className="order-detail-footer">
                        <button className="btn-close-detail" onClick={this.closeOrderDetails}>
                            <FaTimes className="btn-icon" /> Đóng
                        </button>
                        <Link to="/products" className="btn-continue-shopping">
                            <FaShoppingCart className="btn-icon" /> Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    renderPagination() {
        const { currentPage, ordersPerPage } = this.state;
        const filteredOrders = this.getFilteredOrders();
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
        
        // Nếu chỉ có 1 trang thì không hiển thị phân trang
        if (totalPages <= 1) return null;
        
        // Tạo mảng các số trang để hiển thị
        const pageNumbers = [];
        
        // Hiển thị tối đa 5 số trang, với trang hiện tại ở giữa nếu có thể
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Luôn hiển thị trang đầu tiên
        if (startPage > 1) {
            pageNumbers.push(
                <li key={1} className="page-item">
                    <button 
                        className="page-link" 
                        onClick={() => this.handlePageChange(1)}
                    >
                        1
                    </button>
                </li>
            );
            
            // Hiển thị dấu "..." nếu trang đầu tiên không liền kề
            if (startPage > 2) {
                pageNumbers.push(
                    <li key="ellipsis1" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
        }
        
        // Thêm các số trang
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
                    <button 
                        className="page-link" 
                        onClick={() => this.handlePageChange(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        
        // Hiển thị dấu "..." và trang cuối nếu cần
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push(
                    <li key="ellipsis2" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
            pageNumbers.push(
                <li key={totalPages} className="page-item">
                    <button 
                        className="page-link" 
                        onClick={() => this.handlePageChange(totalPages)}
                    >
                        {totalPages}
                    </button>
                </li>
            );
        }
        
        return (
            <div className="orders-pagination">
                <ul className="pagination flower-pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link page-link-arrow" 
                            onClick={() => this.handlePageChange(1)}
                            disabled={currentPage === 1}
                            aria-label="First page"
                        >
                            <FaAngleDoubleLeft />
                        </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link page-link-arrow" 
                            onClick={this.goToPrevPage}
                            disabled={currentPage === 1}
                        >
                            <FaChevronLeft />
                        </button>
                    </li>
                    
                    {pageNumbers}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link page-link-arrow" 
                            onClick={this.goToNextPage}
                            disabled={currentPage === totalPages}
                        >
                            <FaChevronRight />
                        </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link page-link-arrow" 
                            onClick={() => this.handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            aria-label="Last page"
                        >
                            <FaAngleDoubleRight />
                        </button>
                    </li>
                </ul>
            </div>
        );
    }

    render() {
        const { orders, loading, error, activeFilter } = this.state;
        
        // Xử lý loading state
        if (loading) {
            return (
                <div className="my-orders-loading animated fadeIn">
                    <div className="loading-animation">
                        <div className="spinner"></div>
                    </div>
                    <p>Đang tải đơn hàng của bạn...</p>
                </div>
            );
        }
        
        // Xử lý error state
        if (error) {
            return (
                <div className="my-orders-error animated fadeIn">
                    <div className="error-icon">❌</div>
                    <h3>Không thể tải đơn hàng</h3>
                    <p>{error}</p>
                    <Link to="/login" className="btn-login">
                        <FaUser /> Đăng nhập ngay
                    </Link>
                </div>
            );
        }
        
        // Hiển thị trạng thái trống nếu không có đơn hàng
        if (!orders || orders.length === 0) {
            return this.renderEmptyState();
        }
    
        // Lọc đơn hàng theo trạng thái
        const filteredOrders = this.getFilteredOrders();
        // Lấy đơn hàng cho trang hiện tại
        const currentOrders = this.getCurrentOrders();
    
        // Tính toán các số liệu thống kê
        const pendingCount = orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length;
        const processingCount = orders.filter(o => o.status === 'processing').length;
        const shippingCount = orders.filter(o => o.status === 'shipping').length;
        const deliveredCount = orders.filter(o => o.status === 'delivered').length;
        const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    
        return (
            <div className="my-orders-container">
                {/* Header được cải tiến */}
                <div className="my-orders-header">
                    <div className="header-content">
                        <div className="header-icon-container">
                            <FaClipboardList className="header-icon" />
                        </div>
                        <div className="header-text">
                            <h1>Đơn Hàng Của Tôi</h1>
                            <p>Theo dõi và quản lý tất cả đơn hàng của bạn tại đây</p>
                        </div>
                    </div>
                    <div className="header-decoration">
                        <span className="header-flower">🌸</span>
                        <span className="header-flower">🌹</span>
                        <span className="header-flower">🌺</span>
                    </div>
                    </div>
                
                {/* Filter tabs - Thiết kế giống thanh điều hướng */}
                <div className="orders-filter-tabs">
                    <div className="filter-tabs-container">
                        <button 
                            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`} 
                            onClick={() => this.filterOrders('all')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon">🔍</span>
                                <span className="tab-text">Tất cả</span>
                            </span>
                            <span className="tab-badge">{orders.length}</span>
                        </button>
                        
                        <button 
                            className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => this.filterOrders('pending')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon"><FaSpinner /></span>
                                <span className="tab-text">Chờ xác nhận</span>
                            </span>
                            <span className="tab-badge">{pendingCount}</span>
                        </button>
                        
                        <button 
                            className={`filter-tab ${activeFilter === 'processing' ? 'active' : ''}`}
                            onClick={() => this.filterOrders('processing')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon"><FaBoxOpen /></span>
                                <span className="tab-text">Đang xử lý</span>
                            </span>
                            <span className="tab-badge">{processingCount}</span>
                        </button>
                        
                        <button 
                            className={`filter-tab ${activeFilter === 'shipping' ? 'active' : ''}`}
                            onClick={() => this.filterOrders('shipping')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon"><FaTruck /></span>
                                <span className="tab-text">Đang giao</span>
                            </span>
                            <span className="tab-badge">{shippingCount}</span>
                        </button>
                        
                        <button 
                            className={`filter-tab ${activeFilter === 'delivered' ? 'active' : ''}`}
                            onClick={() => this.filterOrders('delivered')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon"><FaCheck /></span>
                                <span className="tab-text">Đã giao</span>
                            </span>
                            <span className="tab-badge">{deliveredCount}</span>
                        </button>
                        
                        <button 
                            className={`filter-tab ${activeFilter === 'cancelled' ? 'active' : ''}`}
                            onClick={() => this.filterOrders('cancelled')}
                        >
                            <span className="tab-content">
                                <span className="tab-icon"><FaBan /></span>
                                <span className="tab-text">Đã hủy</span>
                            </span>
                            <span className="tab-badge">{cancelledCount}</span>
                        </button>
                    </div>
                </div>
                
                {/* Hiển thị kết quả lọc */}
                <div className="orders-result-info">
                    <p>
                        <span className="result-highlight">
                            {filteredOrders.length} 
                        </span> đơn hàng {activeFilter !== 'all' ? `(${this.getOrderStatus(activeFilter).label})` : ''}
                    </p>
                </div>

                {/* Bảng danh sách đơn hàng */}
                <div className="orders-table-container">
                    <div className="orders-table-header">
                        <div className="order-header-cell order-id-cell">Mã đơn hàng</div>
                        <div className="order-header-cell order-date-cell">Ngày đặt</div>
                        <div className="order-header-cell order-items-cell">Sản phẩm</div>
                        <div className="order-header-cell order-total-cell">Tổng tiền</div>
                        <div className="order-header-cell order-status-cell">Trạng thái</div>
                        <div className="order-header-cell order-actions-cell">Thao tác</div>
                    </div>
                    
                    <div className="orders-table-body">
                        {currentOrders.length === 0 ? (
                            <div className="no-orders-message">
                                <div className="no-orders-icon">
                                    <FaFilter />
                                </div>
                                <p>Không tìm thấy đơn hàng nào</p>
                                <button 
                                    className="btn-reset-filter" 
                                    onClick={() => this.filterOrders('all')}
                                >
                                    Xem tất cả đơn hàng
                                </button>
                            </div>
                        ) : (
                            currentOrders.map((order, index) => {
                                // Tính tổng số sản phẩm
                                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                
                                // Lấy thông tin sản phẩm đầu tiên để hiển thị
                                const firstItem = order.items[0]?.product || {};
                                
                                // Hiển thị tổng tiền
                                const orderTotal = this.calculateFinalTotal(order);
                                
                                return (
                                    <div 
                                        key={order._id} 
                                        className="order-row animated fadeInUp"
                                        style={{"--delay": `${0.1 + index * 0.05}s`}}
                                    >
                                        <div className="order-cell order-id-cell">
                                            <div className="cell-label">Mã đơn hàng:</div>
                                            <div className="order-id">#{order._id.substring(0, 8)}</div>
                                        </div>
                                        
                                        <div className="order-cell order-date-cell">
                                            <div className="cell-label">Ngày đặt:</div>
                                            <div className="order-date">
                                                <FaCalendar className="cell-icon" />
                                                {this.formatDate(order.date)}
                                            </div>
                                        </div>
                                        
                                        <div className="order-cell order-items-cell">
                                            <div className="cell-label">Sản phẩm:</div>
                                            <div className="order-items-preview">
                                                <div className="preview-image-container">
                                                    <img 
                                                        src={this.renderProductImage(firstItem)}
                                                        alt={firstItem.name || 'Sản phẩm'} 
                                                        className="preview-image"
                                                        onError={(e) => { e.target.src = '/images/default-product.png' }}
                                                    />
                                                </div>
                                                <div className="preview-text">
                                                    <span className="item-name">{firstItem.name || 'Sản phẩm'}</span>
                                                    {order.items.length > 1 && (
                                                        <span className="more-items">
                                                            +{order.items.length - 1} sản phẩm khác
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="order-cell order-total-cell">
                                            <div className="cell-label">Tổng tiền:</div>
                                            <div className="order-total">
                                                <div className="order-final-total">
                                                    {this.formatCurrency(this.calculateFinalTotal(order))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="order-cell order-status-cell">
                                            <div className="cell-label">Trạng thái:</div>
                                            <div className="order-status-wrapper">
                                                <span className={`order-status-badge ${this.getOrderStatus(order.status).className}`}>
                                                    <span className="status-dot"></span>
                                                    <span className="status-text">{this.getOrderStatus(order.status).label}</span>
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="order-cell order-actions-cell">
                                            <div className="cell-label">Thao tác:</div>
                                            <div className="order-actions">
                                                <button
                                                    className="btn-view-order"
                                                    onClick={(event) => this.handleViewOrderDetail(order, event)}
                                                    aria-label="Xem chi tiết đơn hàng"
                                                >
                                                    <FaEye className="btn-icon" />
                                                    <span>Chi tiết</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                
                {/* Phân trang */}
                {this.renderPagination()}
                
                {/* Modal chi tiết đơn hàng */}
                {this.renderOrderDetailModal()}
            </div>
        );
    }
}

export default MyOrders;