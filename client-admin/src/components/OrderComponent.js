import React, { Component } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Spinner, Modal, Badge } from 'react-bootstrap';
import { FaSearch, FaFilter, FaCalendar, FaSort, FaEnvelope, FaFilePdf, FaTimes, FaUser, FaList, FaShoppingBag, FaEye, FaTrash, FaMoneyBillWave, FaCreditCard, FaTruck } from 'react-icons/fa';
import { MdShoppingCart } from 'react-icons/md';
import axios from 'axios';
import MyContext from '../contexts/MyContext';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate } from './formatters';
import '../styles/OrderComponent.css';

class Order extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            noPages: 1,
            curPage: 1,
            itemsPerPage: 10,
            loading: false,
            modalLoading: false,
            filters: {
                search: '',
                orderId: '',
                phone: '',
                status: '',
                deliveryOption: '',
                startDate: '',
                endDate: ''
            },
            sort: {
                field: 'date',
                order: 'desc'
            },
            showAdvancedFilters: false,
            showDetailModal: false,
            selectedOrder: null,
            updatingStatus: false,
            exporting: false,
            sending: false
        };
    }
    // Thêm phương thức này vào class Order

    handleSendStatusUpdate = async () => {
        const { selectedOrder } = this.state;
        if (!selectedOrder) return;

        // Kiểm tra xem có email không
        const email = selectedOrder.customer?.email || selectedOrder.customerInfo?.email;

        if (!email || email === 'N/A') {
            toast.error('Đơn hàng này không có địa chỉ email để gửi thông báo');
            return;
        }

        try {
            this.setState({ sending: true });

            // Tạo payload với thông tin đầy đủ
            const payload = {
                customerInfo: {
                    name: selectedOrder.customer?.name || 'Khách hàng',
                    email: email,
                    phone: selectedOrder.customer?.phone || 'N/A',
                    address: selectedOrder.customer?.address || 'N/A'
                },
                // Thêm trạng thái hiện tại để email biết cần thông báo gì
                currentStatus: selectedOrder.status
            };

            console.log("Gửi thông báo trạng thái:", payload);

            const response = await axios.post(
                `/api/admin/orders/${selectedOrder._id}/send-status-notification`,
                payload,
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success(`Đã gửi thông báo cập nhật trạng thái "${this.statusOptions[selectedOrder.status]}" qua email!`);
            } else {
                throw new Error(response.data.message || 'Không thể gửi email');
            }
        } catch (error) {
            console.error('Email sending error details:', error);
            toast.error('Lỗi khi gửi email thông báo: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ sending: false });
        }
    };

    getImageUrl = (image) => {
        if (!image) return '/images/default-product.png';
        if (image.startsWith('http')) return image;
        if (image.startsWith('data:image')) return image;
        return `data:image/jpeg;base64,${image}`;
    };

    formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'N/A';
        }
    };
    renderPageNumbers = () => {
        const { curPage, noPages } = this.state;
        const pageNumbers = [];

        // Logic để hiển thị các số trang thông minh
        // Chỉ hiển thị tối đa 5 số trang với trang hiện tại ở giữa
        let startPage = Math.max(1, curPage - 2);
        let endPage = Math.min(noPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // Thêm số trang đầu tiên và dấu "..."
        if (startPage > 1) {
            pageNumbers.push(
                <li key={1} className="page-item">
                    <button
                        className="page-link"
                        onClick={() => this.loadOrders(1)}
                        disabled={this.state.loading}
                    >
                        1
                    </button>
                </li>
            );
            if (startPage > 2) {
                pageNumbers.push(
                    <li key="ellipsis1" className="page-item disabled">
                        <button className="page-link page-ellipsis">...</button>
                    </li>
                );
            }
        }

        // Thêm các số trang chính
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <li key={i} className={`page-item ${i === curPage ? 'active' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => this.loadOrders(i)}
                        disabled={i === curPage || this.state.loading}
                    >
                        {i}
                        {i === curPage && <span className="visually-hidden">(current)</span>}
                    </button>
                </li>
            );
        }

        // Thêm dấu "..." và số trang cuối cùng
        if (endPage < noPages) {
            if (endPage < noPages - 1) {
                pageNumbers.push(
                    <li key="ellipsis2" className="page-item disabled">
                        <button className="page-link page-ellipsis">...</button>
                    </li>
                );
            }
            pageNumbers.push(
                <li key={noPages} className="page-item">
                    <button
                        className="page-link"
                        onClick={() => this.loadOrders(noPages)}
                        disabled={this.state.loading}
                    >
                        {noPages}
                    </button>
                </li>
            );
        }

        return pageNumbers;
    };

    calculateOrderTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((total, item) => {
            const quantity = Number(item?.quantity || 0);
            const price = Number(item?.price || item?.product?.price || 0);
            return total + (quantity * price);
        }, 0);
    };

    statusOptions = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    };

    paymentMethods = {
        'cash': 'Tiền mặt khi nhận hàng',
        'transfer': 'Chuyển khoản ngân hàng'
    };

    componentDidMount() {
        this.loadOrders(1);
    }

    loadOrders = async (page) => {
        const { filters, sort, itemsPerPage } = this.state;
        
        this.setState({ loading: true });
        
        try {
            // Build query string
            const params = new URLSearchParams({
                page: page || 1,
                limit: itemsPerPage,
                sort: sort.field,
                order: sort.order
            });
            
            // Add filters
            if (filters.search) params.append('search', filters.search);
            if (filters.orderId) params.append('orderId', filters.orderId);
            if (filters.phone) params.append('phone', filters.phone);
            if (filters.status) params.append('status', filters.status);
            if (filters.deliveryOption) params.append('deliveryOption', filters.deliveryOption);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            // Fetch orders
            const response = await axios.get(
                `/api/admin/orders?${params.toString()}`,
                { headers: { 'x-access-token': this.context.token } }
            );
            
            if (response.data && response.data.success) {
                this.setState({
                    orders: response.data.orders,
                    noPages: response.data.noPages,
                    curPage: page || 1
                });
            } else {
                toast.error('Không thể tải danh sách đơn hàng');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('Lỗi khi tải đơn hàng: ' + error.message);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleExportPDF = async () => {
        const { selectedOrder } = this.state;
        if (!selectedOrder) return;

        try {
            this.setState({ exporting: true });
            const response = await axios.get(
                `/api/admin/orders/${selectedOrder._id}/export`,
                {
                    headers: { 'x-access-token': this.context.token },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `don-hang-${selectedOrder._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            toast.success('Xuất PDF thành công!');
        } catch (error) {
            toast.error('Lỗi khi xuất PDF: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ exporting: false });
        }
    };

    handleViewOrderDetail = async (orderId, event) => {
        // Prevent default behavior if an event is passed
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        
        try {
            // Set loading state only for the modal
            this.setState({ 
                showDetailModal: true, 
                modalLoading: true,
                selectedOrder: null
            });
            
            const response = await axios.get(`/api/admin/orders/${orderId}`, {
                headers: { 'x-access-token': this.context.token }
            });
            
            if (response.data && response.data.success) {
                const order = response.data.order;
                
                // Ensure all required fields are present
                const processedOrder = {
                    ...order,
                    deliveryOption: order.deliveryOption || 'standard',
                    shippingFee: order.shippingFee !== undefined ? order.shippingFee : 0,
                    subtotal: order.subtotal || this.calculateOrderTotal(order.items || []),
                    items: order.items || []
                };
                
                this.setState({
                    selectedOrder: processedOrder,
                    modalLoading: false
                });
            } else {
                toast.error(response.data?.message || 'Không thể tải thông tin đơn hàng');
                this.setState({ showDetailModal: false, modalLoading: false });
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            toast.error('Lỗi khi tải thông tin đơn hàng: ' + (error.message || 'Không xác định'));
            this.setState({ showDetailModal: false, modalLoading: false });
        }
    };

    handleUpdateStatus = async (orderId, newStatus) => {
        try {
            this.setState({ updatingStatus: true });
            const response = await axios.put(
                `/api/admin/orders/${orderId}/status`,
                { status: newStatus },
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success('Cập nhật trạng thái thành công');
                this.loadOrders(this.state.curPage);
                this.setState({
                    selectedOrder: { ...this.state.selectedOrder, status: newStatus }
                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            toast.error('Lỗi cập nhật trạng thái: ' + error.message);
        } finally {
            this.setState({ updatingStatus: false });
        }
    };

    handleSendConfirmation = async () => {
        const { selectedOrder } = this.state;
        if (!selectedOrder) return;

        // Kiểm tra xem có email không
        const email = selectedOrder.customer?.email || selectedOrder.customerInfo?.email;

        if (!email || email === 'N/A') {
            toast.error('Đơn hàng này không có địa chỉ email để gửi xác nhận');
            return;
        }

        try {
            this.setState({ sending: true });

            // Tạo payload với thông tin khách hàng đầy đủ
            const payload = {
                customerInfo: {
                    name: selectedOrder.customer?.name || 'Khách hàng',
                    email: email,
                    phone: selectedOrder.customer?.phone || 'N/A',
                    address: selectedOrder.customer?.address || 'N/A'
                }
            };

            console.log("Gửi thông tin khách hàng:", payload);

            const response = await axios.post(
                `/api/admin/orders/${selectedOrder._id}/send-confirmation`,
                payload,
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success(`Đã gửi email xác nhận đơn hàng tới địa chỉ ${email}!`);
            } else {
                throw new Error(response.data.message || 'Không thể gửi email');
            }
        } catch (error) {
            console.error('Email sending error details:', error);
            toast.error('Lỗi khi gửi email: ' + (error.response?.data?.message || error.message));
        } finally {
            this.setState({ sending: false });
        }
    };

    handleFilterChange = (field, value) => {
        this.setState(prev => ({
            filters: {
                ...prev.filters,
                [field]: value
            },
            curPage: 1
        }), () => this.loadOrders(1));
    };

    handleClearFilters = () => {
        this.setState({
            filters: {
                search: '',
                orderId: '',
                phone: '',
                status: '',
                deliveryOption: '',
                startDate: '',
                endDate: ''
            },
            curPage: 1
        }, () => this.loadOrders(1));
        toast.success('Đã xóa tất cả bộ lọc');
    };

    isFiltersApplied = () => {
        const { filters } = this.state;
        return filters.search || filters.orderId || filters.phone || filters.status || filters.startDate || filters.endDate || filters.deliveryOption;
    };

    handleSort = (field) => {
        this.setState(prev => ({
            sort: {
                field,
                order: prev.sort.field === field && prev.sort.order === 'asc' ? 'desc' : 'asc'
            },
            curPage: 1
        }), () => this.loadOrders(1));
    };

    getStatusBadge = (status) => {
        return (
            <span className={`status-badge ${status}`}>
                {this.statusOptions[status]}
            </span>
        );
    };

    getPaymentMethodBadge = (paymentMethod) => {
        // Kiểm tra nếu paymentMethod là falsy (null, undefined, empty string)
        if (!paymentMethod) {
            return <Badge bg="secondary">Không xác định</Badge>;
        }

        // Chuẩn hóa paymentMethod về chữ thường để tránh lỗi so sánh
        const method = paymentMethod && typeof paymentMethod === 'string' ? paymentMethod.trim().toLowerCase() : '';

        console.log("Badge rendering payment method:", method);

        if (method === 'cash') {
            return (
                <Badge bg="success" className="d-flex align-items-center">
                    <FaMoneyBillWave className="me-1" /> Tiền mặt (COD)
                </Badge>
            );
        } else if (method === 'transfer') {
            return (
                <Badge bg="primary" className="d-flex align-items-center">
                    <FaCreditCard className="me-1" /> Chuyển khoản ngân hàng
                </Badge>
            );
        }

        return <Badge bg="secondary">Không xác định: "{paymentMethod}"</Badge>;
    };

    handleDeleteOrder = async (orderId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
            try {
                const response = await axios.delete(
                    `/api/admin/orders/${orderId}`,
                    { headers: { 'x-access-token': this.context.token } }
                );

                if (response.data.success) {
                    toast.success('Xóa đơn hàng thành công');
                    this.loadOrders(this.state.curPage);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                toast.error('Lỗi xóa đơn hàng: ' + error.message);
            }
        }
    };

    // Update the shipping fee display in modal
    renderShippingFeeDisplay = (order) => {
        // If the order explicitly has a shippingFee value, use that
        if (order.shippingFee !== undefined && order.shippingFee !== null) {
            return formatCurrency(order.shippingFee);
        }
        
        // Otherwise, calculate based on delivery option
        if (order.deliveryOption === 'express') {
            return formatCurrency(30000);
        }
        
        // Default for standard delivery
        return formatCurrency(0);
    }

    // Add a method to calculate the final total including shipping fee
    calculateFinalTotal = (order) => {
        const subtotal = this.calculateOrderTotal(order.items);
        
        // If the order explicitly has a shippingFee value, use that
        if (order.shippingFee !== undefined && order.shippingFee !== null) {
            return subtotal + order.shippingFee;
        }
        
        // Otherwise, calculate based on delivery option
        if (order.deliveryOption === 'express') {
            return subtotal + 30000;
        }
        
        // Default for standard delivery
        return subtotal;
    }

    // Add new helper method to get delivery method badge
    getDeliveryMethodBadge = (deliveryOption) => {
        if (!deliveryOption) return <Badge bg="secondary">Tiêu chuẩn</Badge>;
        
        switch (deliveryOption) {
            case 'express':
                return <Badge bg="danger">Giao hàng nhanh</Badge>;
            case 'standard':
            default:
                return <Badge bg="info">Giao hàng tiêu chuẩn</Badge>;
        }
    };

    // Delivery options for filter
    deliveryOptions = {
        'standard': 'Giao hàng tiêu chuẩn',
        'express': 'Giao hàng nhanh'
    };

    renderTableBody() {
        const { orders, loading } = this.state;

        if (loading) {
            return (
                <tr>
                    <td colSpan="7" className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                        <span className="text-muted">Đang tải dữ liệu...</span>
                    </td>
                </tr>
            );
        }

        if (!orders || orders.length === 0) {
            return (
                <tr>
                    <td colSpan="7" className="text-center py-5">
                        <MdShoppingCart size={40} className="text-muted mb-3" />
                        <p className="text-muted mb-0">Không có đơn hàng nào</p>
                    </td>
                </tr>
            );
        }

        return orders.map((order) => (
            <tr key={order._id}>
                <td>#{order._id}</td>
                <td>{order.customer?.name || 'Khách hàng không xác định'}</td>
                <td>{formatCurrency(this.calculateFinalTotal(order))}</td>
                <td>{this.getStatusBadge(order.status)}</td>
                <td>
                    <div className="d-flex align-items-center">
                        <FaCalendar className="text-muted me-2" size={14} />
                        {this.formatDate(order.date)}
                    </div>
                </td>
                <td>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(event) => this.handleViewOrderDetail(order._id, event)}
                            className="action-button"
                        >
                            <FaEye className="me-1" /> Chi tiết
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => this.handleDeleteOrder(order._id)}
                            className="action-button"
                        >
                            <FaTrash className="me-1" /> Xóa
                        </Button>
                    </div>
                </td>
            </tr>
        ));
    }

    renderFilters() {
        return (
            <Card.Body className="border-bottom filter-section">
                <Row className="g-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaSearch className="me-2 text-muted" />
                                Tìm theo khách hàng
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Tìm theo tên khách hàng..."
                                value={this.state.filters.search}
                                onChange={(e) => this.handleFilterChange('search', e.target.value)}
                                className="search-input"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaList className="me-2 text-muted" />
                                Mã đơn hàng
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập mã đơn hàng..."
                                value={this.state.filters.orderId}
                                onChange={(e) => this.handleFilterChange('orderId', e.target.value)}
                                className="search-input"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaUser className="me-2 text-muted" />
                                Số điện thoại
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập số điện thoại..."
                                value={this.state.filters.phone}
                                onChange={(e) => this.handleFilterChange('phone', e.target.value)}
                                className="search-input"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaShoppingBag className="me-2 text-muted" />
                                Trạng thái
                            </Form.Label>
                            <Form.Select
                                value={this.state.filters.status}
                                onChange={(e) => this.handleFilterChange('status', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tất cả trạng thái</option>
                                {Object.entries(this.statusOptions).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="g-3 mt-1">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaCalendar className="me-2 text-muted" />
                                Từ ngày
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={this.state.filters.startDate}
                                onChange={(e) => this.handleFilterChange('startDate', e.target.value)}
                                className="filter-select"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaCalendar className="me-2 text-muted" />
                                Đến ngày
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={this.state.filters.endDate}
                                onChange={(e) => this.handleFilterChange('endDate', e.target.value)}
                                className="filter-select"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                <FaTruck className="me-2 text-muted" />
                                Phương thức vận chuyển
                            </Form.Label>
                            <Form.Select
                                value={this.state.filters.deliveryOption}
                                onChange={(e) => this.handleFilterChange('deliveryOption', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tất cả phương thức</option>
                                {Object.entries(this.deliveryOptions).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                        <Button
                            variant="outline-secondary"
                            onClick={this.handleClearFilters}
                            className="w-100 mt-auto"
                            disabled={!this.isFiltersApplied()}
                        >
                            <FaTimes className="me-2" />
                            Xóa bộ lọc
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        );
    }

    // Add a method to handle closing the modal
    handleCloseModal = () => {
        this.setState({ 
            showDetailModal: false,
            selectedOrder: null
        });
    }

    // Add a smart text display function for long text
    renderSmartText = (text, defaultText = 'Chưa cập nhật') => {
        if (!text) return defaultText;
        
        // Define a reasonable character limit before using marquee
        const MAX_LENGTH = 25;
        
        if (text.length > MAX_LENGTH) {
            return (
                <div className="text-truncate-container" title={text}>
                    <div className="text-marquee">
                        {text}
                    </div>
                </div>
            );
        }
        
        return text;
    }

    render() {
        const { showDetailModal, selectedOrder, updatingStatus, loading, modalLoading } = this.state;

        return (
            <Container fluid>
                <Card className="order-card shadow-sm border-0">
                    <Card.Header className="order-header">
                        <Row className="align-items-center">
                            <Col>
                                <h5 className="mb-0">
                                    <MdShoppingCart className="me-2" />
                                    Quản lý Đơn hàng
                                </h5>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant={this.state.showAdvancedFilters ? "primary" : "outline-light"}
                                    onClick={() => this.setState({ showAdvancedFilters: !this.state.showAdvancedFilters })}
                                    className="filter-toggle-button"
                                >
                                    <FaFilter className="me-2" />
                                    {this.state.showAdvancedFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>

                    {this.state.showAdvancedFilters && this.renderFilters()}

                    <div className="table-responsive position-relative">
                        {loading && (
                            <div className="loading-overlay">
                                <div className="loading-spinner" />
                            </div>
                        )}
                        <Table hover className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th onClick={() => this.handleSort('_id')} style={{ cursor: 'pointer' }}>
                                        Mã đơn hàng <FaSort className="ms-1" />
                                    </th>
                                    <th onClick={() => this.handleSort('name')} style={{ cursor: 'pointer' }}>
                                        Tên khách hàng <FaSort className="ms-1" />
                                    </th>
                                    <th onClick={() => this.handleSort('total')} style={{ cursor: 'pointer' }}>
                                        Tổng tiền <FaSort className="ms-1" />
                                    </th>
                                    <th onClick={() => this.handleSort('status')} style={{ cursor: 'pointer' }}>
                                        Trạng thái <FaSort className="ms-1" />
                                    </th>
                                    <th onClick={() => this.handleSort('date')} style={{ cursor: 'pointer' }}>
                                        Ngày đặt <FaSort className="ms-1" />
                                    </th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.renderTableBody()}
                            </tbody>
                        </Table>
                    </div>
                </Card>

                <Modal
                    show={showDetailModal}
                    onHide={this.handleCloseModal}
                    size="lg"
                    dialogClassName="order-detail-modal"
                    centered
                >
                    <Modal.Header closeButton className="modal-header-gradient-success">
                        <Modal.Title className="d-flex align-items-center text-white">
                            <div className="modal-icon-circle success">
                                <FaShoppingBag className="modal-title-icon" />
                            </div>
                            Chi tiết đơn hàng {selectedOrder && <span className="order-id-label ms-2">#{selectedOrder._id}</span>}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="p-0">
                        {!selectedOrder || modalLoading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 text-muted">Đang tải thông tin đơn hàng...</p>
                            </div>
                        ) : (
                            <div className="order-detail">
                                <Row className="m-0 g-0">
                                    <Col md={6} className="border-end">
                                        <div className="customer-info p-4">
                                            <h6 className="section-title d-flex align-items-center mb-3">
                                                <span className="section-icon-wrapper me-2">
                                                    <FaUser className="section-icon" />
                                                </span>
                                                Thông tin khách hàng
                                            </h6>

                                            <div className="info-group">
                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Tên khách hàng:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {this.renderSmartText(selectedOrder.customer?.name)}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Số điện thoại:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {this.renderSmartText(selectedOrder.customer?.phone)}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Email:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        <div className="text-truncate-container" title={selectedOrder.customer?.email || 'Chưa cập nhật'}>
                                                            <div className="text-marquee">
                                                                {selectedOrder.customer?.email || 'Chưa cập nhật'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted align-self-start">Địa chỉ:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {this.renderSmartText(selectedOrder.customer?.address)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div className="order-info p-4 bg-light h-100">
                                            <h6 className="section-title d-flex align-items-center mb-3 success">
                                                <span className="section-icon-wrapper success me-2">
                                                    <FaShoppingBag className="section-icon" />
                                                </span>
                                                Thông tin đơn hàng
                                            </h6>

                                            <div className="info-group">
                                                <div className="info-item d-flex align-items-center mb-3">
                                                    <div className="info-label text-muted">Trạng thái:</div>
                                                    <div className="info-value ms-2 d-flex align-items-center">
                                                        <div style={{ minWidth: '140px' }}>
                                                            <Form.Select
                                                                size="sm"
                                                                value={selectedOrder.status}
                                                                onChange={(e) => this.handleUpdateStatus(selectedOrder._id, e.target.value)}
                                                                disabled={updatingStatus}
                                                                className="status-select"
                                                            >
                                                                {Object.entries(this.statusOptions).map(([value, label]) => (
                                                                    <option key={value} value={value}>{label}</option>
                                                                ))}
                                                            </Form.Select>
                                                        </div>
                                                        {updatingStatus && <Spinner size="sm" animation="border" className="ms-2" />}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Ngày đặt:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {this.formatDate(selectedOrder.date)}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Thanh toán:</div>
                                                    <div className="info-value ms-2">
                                                        {this.getPaymentMethodBadge(selectedOrder.paymentMethod)}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted">Vận chuyển:</div>
                                                    <div className="info-value ms-2">
                                                        {this.getDeliveryMethodBadge(selectedOrder.deliveryOption)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="products-table bg-light p-4 mt-2 rounded-bottom">
                                    <h6 className="section-title d-flex align-items-center border-bottom pb-3 mb-3 success">
                                        <span className="section-icon-wrapper success me-2">
                                            <FaList className="section-icon" />
                                        </span>
                                        Chi tiết sản phẩm
                                    </h6>

                                    <div className="table-responsive">
                                        <Table hover className="bg-white rounded mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th style={{ width: "70px" }}>Ảnh</th>
                                                    <th>Tên sản phẩm</th>
                                                    <th className="text-center" style={{ width: "100px" }}>Số lượng</th>
                                                    <th className="text-end" style={{ width: "130px" }}>Đơn giá</th>
                                                    <th className="text-end" style={{ width: "150px" }}>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="product-image-container">
                                                                <img
                                                                    src={this.getImageUrl(item.product?.image)}
                                                                    alt={item.product?.name}
                                                                    className="rounded product-image"
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/images/default-product.png';
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <p className="mb-0 fw-medium">
                                                                {this.renderSmartText(item.product?.name)}
                                                            </p>
                                                        </td>
                                                        <td className="text-center fw-medium">{item.quantity}</td>
                                                        <td className="text-end">{formatCurrency(item.price || item.product?.price || 0)}</td>
                                                        <td className="text-end fw-bold">{formatCurrency((item.price || item.product?.price || 0) * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-light">
                                                    <td colSpan="4" className="text-end fw-bold border-top">Tạm tính:</td>
                                                    <td className="text-end fw-bold border-top">
                                                        {formatCurrency(this.calculateOrderTotal(selectedOrder.items))}
                                                    </td>
                                                </tr>
                                                <tr className="bg-light">
                                                    <td colSpan="4" className="text-end fw-bold">
                                                        Phí vận chuyển:
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        {this.renderShippingFeeDisplay(selectedOrder)}
                                                    </td>
                                                </tr>
                                                <tr className="bg-light">
                                                    <td colSpan="4" className="text-end fw-bold border-top">Tổng cộng:</td>
                                                    <td className="text-end fw-bold text-success fs-5 border-top">
                                                        {formatCurrency(this.calculateFinalTotal(selectedOrder))}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal.Body>

                    {selectedOrder && (
                        <Modal.Footer>
                            <Button variant="secondary" onClick={this.handleCloseModal}>
                                <FaTimes className="me-1" /> Đóng
                            </Button>

                            {/* Nút xuất PDF */}
                            <Button
                                variant="outline-dark"
                                onClick={this.handleExportPDF}
                                disabled={this.state.exporting}
                            >
                                {this.state.exporting ? (
                                    <>
                                        <Spinner size="sm" animation="border" className="me-2" />
                                        Đang xuất...
                                    </>
                                ) : (
                                    <>
                                        <FaFilePdf className="me-1" /> Xuất PDF
                                    </>
                                )}
                            </Button>

                            {/* Nút gửi thông báo trạng thái mới */}
                            <Button
                                variant="outline-info"
                                onClick={this.handleSendStatusUpdate}
                                disabled={this.state.sending}
                                className="ms-2"
                                title="Gửi thông báo trạng thái mới qua email"
                            >
                                {this.state.sending ? (
                                    <>
                                        <Spinner size="sm" animation="border" className="me-2" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <FaEnvelope className="me-1" />
                                        Gửi thông báo trạng thái
                                    </>
                                )}
                            </Button>
                        </Modal.Footer>
                    )}
                </Modal>

                {this.state.noPages > 1 && (
                    <div className="pagination-container d-flex justify-content-center mt-4">
                        <ul className="pagination flower-pagination">
                            <li className={`page-item ${this.state.curPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link page-link-arrow"
                                    onClick={() => this.loadOrders(1)}
                                    disabled={this.state.curPage === 1 || this.state.loading}
                                    aria-label="First page"
                                >
                                    <span aria-hidden="true">&laquo;&laquo;</span>
                                </button>
                            </li>
                            <li className={`page-item ${this.state.curPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link page-link-arrow"
                                    onClick={() => this.loadOrders(this.state.curPage - 1)}
                                    disabled={this.state.curPage === 1 || this.state.loading}
                                >
                                    <span>&laquo;</span>
                                </button>
                            </li>

                            {this.renderPageNumbers()}

                            <li className={`page-item ${this.state.curPage === this.state.noPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link page-link-arrow"
                                    onClick={() => this.loadOrders(this.state.curPage + 1)}
                                    disabled={this.state.curPage === this.state.noPages || this.state.loading}
                                >
                                    <span>&raquo;</span>
                                </button>
                            </li>
                            <li className={`page-item ${this.state.curPage === this.state.noPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link page-link-arrow"
                                    onClick={() => this.loadOrders(this.state.noPages)}
                                    disabled={this.state.curPage === this.state.noPages || this.state.loading}
                                    aria-label="Last page"
                                >
                                    <span aria-hidden="true">&raquo;&raquo;</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </Container>
        );
    }
}

export default Order;
