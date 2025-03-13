import React, { Component } from 'react';
import { Container, Card, Table, Form, Row, Col, Badge, Spinner, Button, Modal, Nav, Tab, Alert } from 'react-bootstrap';
import { FaUser, FaSearch, FaSort, FaTrash, FaEye, FaShoppingBag, FaHistory, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaCheck, FaInfoCircle, FaList } from 'react-icons/fa';
import axios from 'axios';
import MyContext from '../contexts/MyContext';
import { toast } from 'react-toastify';
import './CustomerComponent.css';

class Customer extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            customers: [],
            noPages: 0,
            curPage: 1,
            loading: false,
            filters: {
                search: ''
            },
            sort: {
                field: 'joinDate',
                order: 'desc'
            },
            showDetailModal: false,
            selectedCustomer: null,
            customerOrders: [],
            loadingOrders: false,
            showOrderDetailModal: false,
            selectedOrder: null,
            loadingOrderDetail: false,
            activeTab: 'info'
        };
    }
    renderPageNumbers = () => {
        const { curPage, noPages, loading } = this.state;
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
                        onClick={() => this.loadCustomers(1)}
                        disabled={loading}
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
                        onClick={() => this.loadCustomers(i)}
                        disabled={i === curPage || loading}
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
                        onClick={() => this.loadCustomers(noPages)}
                        disabled={loading}
                    >
                        {noPages}
                    </button>
                </li>
            );
        }
        
        return pageNumbers;
    };

    componentDidMount() {
        this.loadCustomers(1);
    }

    loadCustomers = async (page) => {
        const { filters, sort } = this.state;
        this.setState({ loading: true });

        try {
            const response = await axios.get('/api/admin/customers', {
                headers: { 'x-access-token': this.context.token },
                params: {
                    page,
                    limit: 10,
                    search: filters.search,
                    sortField: sort.field,
                    sortOrder: sort.order
                }
            });

            if (response.data.success) {
                this.setState({
                    customers: response.data.customers,
                    noPages: response.data.noPages,
                    curPage: page,
                    loading: false
                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            toast.error('Không thể tải danh sách khách hàng: ' + (error.response?.data?.message || error.message));
            this.setState({
                loading: false,
                customers: [],
                error: 'Không thể tải danh sách khách hàng'
            });
        }
    }

    handleViewOrderDetail = async (orderId) => {
        try {
            this.setState({ loadingOrderDetail: true });

            const response = await axios.get(`/api/admin/orders/${orderId}`, {
                headers: { 'x-access-token': this.context.token }
            });

            if (response.data.success) {
                this.setState({
                    selectedOrder: response.data.order,
                    showOrderDetailModal: true,
                    loadingOrderDetail: false
                });
            } else {
                throw new Error(response.data.message || 'Không thể tải chi tiết đơn hàng');
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
            toast.error('Không thể tải chi tiết đơn hàng: ' + (error.response?.data?.message || error.message));
            this.setState({ loadingOrderDetail: false });
        }
    };

    handleFilterChange = (value) => {
        this.setState(prev => ({
            filters: {
                ...prev.filters,
                search: value
            },
            curPage: 1
        }), () => this.loadCustomers(1));
    }

    handleSortChange = (field) => {
        this.setState(prev => ({
            sort: {
                field,
                order: prev.sort.order === 'asc' ? 'desc' : 'asc'
            }
        }), () => this.loadCustomers(this.state.curPage));
    }

    handleStatusChange = async (customerId, newStatus) => {
        if (!customerId) {
            toast.error('ID khách hàng không hợp lệ');
            return;
        }

        const selectedCustomer = this.state.selectedCustomer ||
            this.state.customers.find(c => c._id === customerId);

        let confirmText = '';

        if (newStatus === 'active') {
            if (selectedCustomer && !selectedCustomer.active) {
                confirmText = 'Kích hoạt tài khoản này? Điều này cũng sẽ kích hoạt email đăng nhập nếu chưa được kích hoạt.';
            } else {
                confirmText = 'Bạn có chắc chắn muốn kích hoạt tài khoản này không?';
            }
        } else {
            confirmText = 'Vô hiệu hóa tài khoản này?';
        }

        if (window.confirm(confirmText)) {
            try {
                this.setState({ loading: true });

                const response = await axios.put(
                    `/api/admin/customers/${customerId}/status/${newStatus}`,
                    {},
                    { headers: { 'x-access-token': this.context.token } }
                );

                if (response.data.success) {
                    toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công`);

                    this.loadCustomers(this.state.curPage);

                    if (this.state.selectedCustomer && this.state.selectedCustomer._id === customerId) {
                        this.setState(prevState => ({
                            selectedCustomer: {
                                ...prevState.selectedCustomer,
                                status: newStatus,
                                active: newStatus === 'active' ? true : prevState.selectedCustomer.active
                            }
                        }));
                    }
                } else {
                    throw new Error(response.data.message || `Cập nhật trạng thái thành ${newStatus} thất bại`);
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message;
                toast.error('Lỗi cập nhật trạng thái: ' + errorMessage);
            } finally {
                this.setState({ loading: false });
            }
        }
    };

    handleDeleteCustomer = async (customerId, customerName) => {
        if (window.confirm(`Bạn có chắc muốn xóa khách hàng "${customerName}"?`)) {
            try {
                const response = await axios.delete(
                    `/api/admin/customers/${customerId}`,
                    { headers: { 'x-access-token': this.context.token } }
                );

                if (response.data.success) {
                    toast.success('Xóa khách hàng thành công');

                    if (this.state.selectedCustomer && this.state.selectedCustomer._id === customerId) {
                        this.setState({ showDetailModal: false, selectedCustomer: null });
                    }

                    this.loadCustomers(this.state.curPage);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                toast.error('Lỗi xóa khách hàng: ' + error.message);
            }
        }
    };

    handleViewCustomerDetail = async (customer) => {
        this.setState({
            showDetailModal: true,
            selectedCustomer: customer,
            loadingOrders: true,
            customerOrders: []
        });
    
        try {
            // Sửa đổi URL API để chỉ trả về đơn hàng thuộc về chính xác khách hàng này
            const response = await axios.get(`/api/admin/customers/${customer._id}/orders`, {
                headers: { 'x-access-token': this.context.token },
                params: {
                    exactMatch: true // Thêm tham số để API biết chỉ lấy đơn hàng chính xác của khách hàng
                }
            });
    
            if (response.data.success) {
                const orders = Array.isArray(response.data.orders) ? response.data.orders : [];
    
                const totalSpent = orders.reduce((total, order) => {
                    if (order.status === 'delivered') {
                        return total + (order.total ? Number(order.total) : this.calculateOrderTotal(order.items));
                    }
                    return total;
                }, 0);
    
                const updatedCustomer = {
                    ...customer,
                    totalOrders: orders.length,
                    totalSpent: totalSpent
                };
    
                this.setState({
                    selectedCustomer: updatedCustomer,
                    customerOrders: orders,
                    loadingOrders: false
                });
            } else {
                throw new Error(response.data.message || 'Không thể lấy thông tin đơn hàng');
            }
        } catch (error) {
            console.error('Error loading customer orders:', error);
            toast.error('Không thể tải lịch sử đơn hàng: ' + (error.message || 'Lỗi không xác định'));
            this.setState({
                loadingOrders: false,
                customerOrders: []
            });
        }
    };

    closeDetailModal = () => {
        this.setState({ showDetailModal: false, selectedCustomer: null });
    };

    formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    getOrderStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Chờ xử lý', bgClass: 'warning' },
            'processing': { label: 'Đang xử lý', bgClass: 'primary' },
            'shipping': { label: 'Đang giao', bgClass: 'info' },
            'delivered': { label: 'Đã giao', bgClass: 'success' },
            'cancelled': { label: 'Đã hủy', bgClass: 'danger' }
        };

        const statusInfo = statusMap[status] || { label: status, bgClass: 'secondary' };
        return <Badge bg={statusInfo.bgClass}>{statusInfo.label}</Badge>;
    };

    calculateOrderTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;

        return items.reduce((total, item) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || (item.product && item.product.price) || 0);
            return total + (quantity * price);
        }, 0);
    };

    renderPagination() {
        const { noPages, curPage, loading } = this.state;
        if (noPages <= 1) return null;
    
        return (
            <div className="pagination-container d-flex justify-content-center mt-4">
                <ul className="pagination flower-pagination">
                    <li className={`page-item ${curPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link page-link-arrow"
                            onClick={() => this.loadCustomers(1)}
                            disabled={curPage === 1 || loading}
                            aria-label="First page"
                        >
                            <span aria-hidden="true">&laquo;&laquo;</span>
                        </button>
                    </li>
                    <li className={`page-item ${curPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link page-link-arrow"
                            onClick={() => this.loadCustomers(curPage - 1)}
                            disabled={curPage === 1 || loading}
                        >
                            <span>&laquo;</span>
                        </button>
                    </li>
                    
                    {this.renderPageNumbers()}
                    
                    <li className={`page-item ${curPage === noPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link page-link-arrow"
                            onClick={() => this.loadCustomers(curPage + 1)}
                            disabled={curPage === noPages || loading}
                        >
                            <span>&raquo;</span>
                        </button>
                    </li>
                    <li className={`page-item ${curPage === noPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link page-link-arrow"
                            onClick={() => this.loadCustomers(noPages)}
                            disabled={curPage === noPages || loading}
                            aria-label="Last page"
                        >
                            <span aria-hidden="true">&raquo;&raquo;</span>
                        </button>
                    </li>
                </ul>
            </div>
        );
    }

    handleChangePassword = async (customerId, newPassword) => {
        if (!customerId || !newPassword) {
            toast.error('ID khách hàng hoặc mật khẩu mới không hợp lệ');
            return;
        }

        try {
            this.setState({ loading: true });

            const response = await axios.put(
                `/api/admin/customers/${customerId}/password`,
                { password: newPassword },
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success('Cập nhật mật khẩu thành công');
                this.loadCustomers(this.state.curPage);
            } else {
                throw new Error(response.data.message || 'Cập nhật mật khẩu thất bại');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error('Lỗi cập nhật mật khẩu: ' + errorMessage);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleActivateAccount = async (customerId) => {
        try {
            const selectedCustomer = this.state.selectedCustomer ||
                this.state.customers.find(c => c._id === customerId);

            if (selectedCustomer && selectedCustomer.active) {
                toast.info('Tài khoản đã được kích hoạt trước đó');
                return;
            }

            const response = await axios.put(
                `/api/admin/customers/${customerId}/activate`,
                {},
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success('Đã kích hoạt tài khoản thành công');
                this.loadCustomers(this.state.curPage);
            } else {
                throw new Error(response.data.message || 'Kích hoạt tài khoản thất bại');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error('Lỗi kích hoạt tài khoản: ' + errorMessage);
        }
    };

    render() {
        const {
            customers, loading, showDetailModal, selectedCustomer,
            customerOrders, loadingOrders, filters,
            showOrderDetailModal, selectedOrder
        } = this.state;

        return (
            <div className="customer-page">
                <Container fluid>
                    <Card className="customer-card">
                        <Card.Header className="customer-header py-3 bg-gradient">
                            <Row className="align-items-center">
                                <Col>
                                    <h4 className="mb-0 d-flex align-items-center">
                                        <div className="icon-circle">
                                            <FaUser className="header-icon" />
                                        </div>
                                        <span className="header-title">Quản lý Khách hàng</span>
                                    </h4>
                                </Col>
                                <Col xs="auto">
                                    <Badge bg="light" text="dark" className="customer-count-badge">
                                        <FaUser className="me-1" size={12} />
                                        {customers.length} khách hàng
                                    </Badge>
                                </Col>
                            </Row>
                        </Card.Header>

                        <Card.Body className="p-4">
                            <div className="customer-search-container mb-4">
                                <div className="customer-search">
                                    <FaSearch className="search-icon" />
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm kiếm theo tên, số điện thoại hoặc email..."
                                        value={filters.search}
                                        onChange={(e) => this.handleFilterChange(e.target.value)}
                                        className="customer-input"
                                    />
                                    {filters.search && (
                                        <Button
                                            variant="link"
                                            className="clear-search-btn"
                                            onClick={() => this.handleFilterChange('')}
                                            title="Xóa tìm kiếm"
                                        >
                                            <FaTimes />
                                        </Button>
                                    )}
                                </div>
                                <div className="search-stats">
                                    {filters.search && (
                                        <div className="search-result-text">
                                            <FaInfoCircle className="me-2" />
                                            Tìm thấy {customers.length} kết quả cho "{filters.search}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="table-responsive">
                                <Table hover className="customer-table shadow-sm border-0 rounded overflow-hidden">
                                    <thead className="bg-gradient table-header">
                                        <tr>
                                            <th onClick={() => this.handleSortChange('name')}>
                                                <div className="d-flex align-items-center">
                                                    <span>Họ tên</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'name' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th onClick={() => this.handleSortChange('phone')}>
                                                <div className="d-flex align-items-center">
                                                    <span>Số điện thoại</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'phone' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th onClick={() => this.handleSortChange('email')} className="d-none d-md-table-cell">
                                                <div className="d-flex align-items-center">
                                                    <span>Email</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'email' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th onClick={() => this.handleSortChange('status')}>
                                                <div className="d-flex align-items-center">
                                                    <span>Trạng thái</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'status' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th onClick={() => this.handleSortChange('username')}>
                                                <div className="d-flex align-items-center">
                                                    <span>Tên đăng nhập</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'username' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th onClick={() => this.handleSortChange('isRegistered')}>
                                                <div className="d-flex align-items-center">
                                                    <span>Loại tài khoản</span>
                                                    <FaSort className={`ms-2 sort-icon ${this.state.sort.field === 'isRegistered' ? 'active' : ''}`} />
                                                </div>
                                            </th>
                                            <th className="text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <Spinner animation="border" className="loading-spinner" />
                                                </td>
                                            </tr>
                                        ) : customers.length > 0 ? (
                                            customers.map(customer => (
                                                <tr key={customer._id}>
                                                    <td className="fw-medium">{customer.name || 'Không có tên'}</td>
                                                    <td>{customer.phone || 'N/A'}</td>
                                                    <td className="d-none d-md-table-cell">{customer.email || 'N/A'}</td>
                                                    <td>
                                                        <Badge className={`status-badge ${customer.status}`}>
                                                            {customer.status === 'active' ? 'Kích hoạt' : 'Vô hiệu'}
                                                        </Badge>
                                                    </td>
                                                    <td>{customer.username || 'Chưa đăng ký'}</td>
                                                    <td>
                                                        {customer.username ? (
                                                            <Badge bg="success">Đã đăng ký</Badge>
                                                        ) : (
                                                            <Badge bg="warning" text="dark">Khách vãng lai</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2 align-items-center justify-content-center">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => this.handleViewCustomerDetail(customer)}
                                                                title="Xem chi tiết"
                                                                className="action-button view-button"
                                                            >
                                                                <FaEye />
                                                            </Button>
                                                            <Form.Select
                                                                size="sm"
                                                                value={customer.status}
                                                                onChange={(e) => this.handleStatusChange(customer._id, e.target.value)}
                                                                className="status-select"
                                                                style={{ maxWidth: '110px' }}
                                                            >
                                                                <option value="active">Kích hoạt</option>
                                                                <option value="inactive">Vô hiệu</option>
                                                            </Form.Select>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => this.handleDeleteCustomer(customer._id, customer.name || 'Người dùng này')}
                                                                title="Xóa khách hàng"
                                                                className="action-button delete-button"
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <div className="empty-state">
                                                        <FaUser size={32} className="mb-3 text-muted" />
                                                        <p className="mb-0">Không tìm thấy khách hàng nào</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {this.renderPagination()}
                        </Card.Body>
                    </Card>
                </Container>

                {/* Chi tiết khách hàng Modal */}
                <Modal
                    show={showDetailModal}
                    onHide={this.closeDetailModal}
                    size="lg"
                    className="customer-detail-modal floral-modal"
                >
                    <Modal.Header closeButton className="modal-header-gradient">
                        <div className="floral-pattern-overlay"></div>
                        <Modal.Title className="d-flex align-items-center text-white">
                            <div className="modal-icon-circle">
                                <FaUser className="modal-title-icon" />
                            </div>
                            <div className="modal-title-text">Chi tiết khách hàng</div>
                            <div className="modal-flowers">
                                <span className="modal-flower">🌸</span>
                                <span className="modal-flower">🌷</span>
                            </div>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="p-0">
                        {selectedCustomer && (
                            <Tab.Container
                                defaultActiveKey="info"
                                onSelect={(key) => this.setState({ activeTab: key })}
                            >
                                <Nav variant="tabs" className="customer-detail-tabs">
                                    <Nav.Item>
                                        <Nav.Link eventKey="info" className="tab-link tab-animate">
                                            <FaUser className="me-2" />
                                            <span>Thông tin cá nhân</span>
                                            <div className="tab-highlight"></div>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="orders" className="tab-link">
                                            <FaShoppingBag className="me-2" />
                                            Đơn hàng
                                            {Array.isArray(customerOrders) && customerOrders.length > 0 && (
                                                <Badge pill bg="primary" className="ms-2 order-count-badge">
                                                    {customerOrders.length}
                                                </Badge>
                                            )}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="password" className="tab-link">
                                            <FaLock className="me-2" />
                                            Đổi mật khẩu
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <Tab.Content>
                                    <Tab.Pane eventKey="info">
                                        <div className="customer-info-container">
                                            <div className="profile-header">
                                                <div className="avatar-container">
                                                    <div className="avatar with-flower-border">
                                                        {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'K'}
                                                        <div className="flower-decoration"></div>
                                                    </div>
                                                </div>
                                                <div className="profile-title">
                                                    <h4>{selectedCustomer.name || 'Không có tên'}</h4>
                                                    <div className="badge-container">
                                                        <Badge className={`status-badge-lg ${selectedCustomer.status}`}>
                                                            {selectedCustomer.status === 'active' ? 'Kích hoạt' : 'Vô hiệu'}
                                                        </Badge>
                                                        {selectedCustomer.username ? (
                                                            <Badge bg="success" className="ms-2">Đã đăng ký</Badge>
                                                        ) : (
                                                            <Badge bg="warning" text="dark" className="ms-2">Khách vãng lai</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <FaUser className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Tài khoản :</span>
                                                        <span className="info-value">{selectedCustomer.username || 'Chưa đăng ký'}</span>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <FaLock className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Mật khẩu :</span>
                                                        <span className="info-value">••••••••</span>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <FaEnvelope className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Email :</span>
                                                        <span className="info-value">{selectedCustomer.email || 'Chưa cung cấp'}</span>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <FaPhone className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Số điện thoại :</span>
                                                        <span className="info-value">{selectedCustomer.phone || 'Chưa cung cấp'}</span>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <FaMapMarkerAlt className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Địa chỉ :</span>
                                                        <span className="info-value">{selectedCustomer.address || 'Chưa cung cấp'}</span>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <FaCalendarAlt className="info-icon" />
                                                    <div>
                                                        <span className="info-label">Ngày tham gia :</span>
                                                        <span className="info-value">
                                                            {selectedCustomer.joinDate ? new Date(selectedCustomer.joinDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Thêm phần này để hiển thị tổng đơn hàng và tổng chi tiêu */}
                                            <div className="stats-container">
                                                <div className="stat-card">
                                                    <div className="decoration decoration-1"></div>
                                                    <div className="decoration decoration-2"></div>
                                                    <div className="stat-content">
                                                        <div className="stat-label">Tổng đơn hàng</div>
                                                        <div className="stat-value">
                                                            {selectedCustomer.totalOrders || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="stat-card">
                                                    <div className="decoration decoration-1"></div>
                                                    <div className="decoration decoration-2"></div>
                                                    <div className="stat-content">
                                                        <div className="stat-label">Tổng chi tiêu</div>
                                                        <div className="stat-value">
                                                            {this.formatCurrency(selectedCustomer.totalSpent || 0)}
                                                            <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>
                                                                (Chỉ tính đơn hàng đã giao)
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="orders">
                                        {loadingOrders ? (
                                            <div className="text-center py-4">
                                                <Spinner animation="border" />
                                                <p className="mt-2">Đang tải lịch sử đơn hàng...</p>
                                            </div>
                                        ) : (Array.isArray(customerOrders) && customerOrders.length > 0) ? (
                                            <div className="orders-table-container">
                                                <div className="alert alert-info mb-3">
                                                    <small>
                                                        <FaInfoCircle className="me-2" />
                                                        Chỉ các đơn hàng có trạng thái "Đã giao" mới được tính vào tổng chi tiêu
                                                    </small>
                                                </div>
                                                <Table hover responsive className="orders-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Mã đơn</th>
                                                            <th>Ngày đặt</th>
                                                            <th>Tổng tiền</th>
                                                            <th>Trạng thái</th>
                                                            <th>Sản phẩm</th>
                                                            <th>Hành động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {customerOrders.map(order => {
                                                            const orderTotal = order.total || this.calculateOrderTotal(order.items);
                                                            const isDelivered = order.status === 'delivered';

                                                            return (
                                                                <tr key={order._id} className={isDelivered ? 'bg-light' : ''}>
                                                                    <td className="order-id">#{order._id}</td>
                                                                    <td>
                                                                        {new Date(order.date).toLocaleString('vi-VN', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </td>
                                                                    <td className={`fw-bold ${isDelivered ? 'text-success' : 'text-muted'}`}>
                                                                        {this.formatCurrency(orderTotal)}
                                                                        {isDelivered && <FaCheck className="text-success ms-1" size={12} title="Tính vào tổng chi tiêu" />}
                                                                    </td>
                                                                    <td>{this.getOrderStatusBadge(order.status)}</td>
                                                                    <td>{order.items?.length || 0} sản phẩm</td>
                                                                    <td>
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            onClick={() => this.handleViewOrderDetail(order._id)}
                                                                            className="action-button"
                                                                        >
                                                                            <FaEye className="me-1" />
                                                                            Xem
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <Alert variant="light" className="text-center py-4">
                                                <FaHistory size={32} className="mb-3 text-muted" />
                                                <p className="mb-0">Khách hàng chưa có đơn hàng nào</p>
                                            </Alert>
                                        )}
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="password">
                                        <Form onSubmit={(e) => {
                                            e.preventDefault();
                                            const newPassword = e.target.elements.newPassword.value;
                                            this.handleChangePassword(selectedCustomer._id, newPassword);
                                        }}>
                                            <Form.Group controlId="newPassword">
                                                <Form.Label>Mật khẩu mới</Form.Label>
                                                <Form.Control type="password" placeholder="Nhập mật khẩu mới" required />
                                            </Form.Group>
                                            <Button variant="primary" type="submit" className="mt-3">
                                                Cập nhật mật khẩu
                                            </Button>
                                        </Form>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={this.closeDetailModal}>
                            Đóng
                        </Button>
                        {this.state.activeTab === 'info' && selectedCustomer && (
                            selectedCustomer.status === 'active' ? (
                                <Button
                                    variant="outline-danger"
                                    onClick={() => this.handleStatusChange(selectedCustomer._id, 'inactive')}
                                >
                                    <FaTimes className="me-2" />
                                    Vô hiệu hóa tài khoản
                                </Button>
                            ) : (
                                <Button
                                    variant="outline-success"
                                    onClick={() => this.handleStatusChange(selectedCustomer._id, 'active')}
                                >
                                    <FaCheck className="me-2" />
                                    Kích hoạt tài khoản
                                </Button>
                            )
                        )}
                    </Modal.Footer>

                </Modal>

                {/* Order Detail Modal */}
                <Modal
                    show={showOrderDetailModal}
                    onHide={() => this.setState({ showOrderDetailModal: false })}
                    size="lg"
                    className="order-detail-modal"
                >
                    <Modal.Header closeButton className="modal-header-gradient-success">
                        <Modal.Title className="d-flex align-items-center text-white">
                            <div className="modal-icon-circle success">
                                <FaShoppingBag className="modal-title-icon" />
                            </div>
                            Chi tiết đơn hàng <span className="order-id-label">#{selectedOrder?._id}</span>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="p-0">
                        {selectedOrder && (
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
                                                        {selectedOrder.customer?.name || 'Không có tên'}
                                                        {/* {selectedOrder.customer?.username ? (
                                                            <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem', padding: '0.25em 0.6em' }}>
                                                                Đã đăng ký
                                                            </Badge>
                                                        ) : (
                                                            <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.7rem', padding: '0.25em 0.6em' }}>
                                                                Khách vãng lai
                                                            </Badge>
                                                        )} */}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted" style={{ width: '110px' }}>Số điện thoại:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {selectedOrder.customer?.phone || 'Chưa cập nhật'}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted" style={{ width: '50px' }}>Email:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {selectedOrder.customer?.email || 'Chưa cập nhật'}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted align-self-start" style={{ width: '50px' }}>Địa chỉ:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {selectedOrder.customer?.address || 'Chưa cập nhật'}
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
                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted" style={{ width: '130px' }}>Trạng thái:</div>
                                                    <div className="info-value ms-2">
                                                        {this.getOrderStatusBadge(selectedOrder.status)}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted" style={{ width: '130px' }}>Ngày đặt:</div>
                                                    <div className="info-value ms-2 fw-medium">
                                                        {new Date(selectedOrder.date).toLocaleString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="info-item d-flex mb-3">
                                                    <div className="info-label text-muted" style={{ width: '130px' }}>Tổng tiền:</div>
                                                    <div className="info-value ms-2 text-success fw-bold fs-5">
                                                        {this.formatCurrency(this.calculateOrderTotal(selectedOrder.items))}
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
                                    <Table responsive hover className="bg-white rounded">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Ảnh</th>
                                                <th>Tên sản phẩm</th>
                                                <th className="text-center">Số lượng</th>
                                                <th className="text-end">Đơn giá</th>
                                                <th className="text-end">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td style={{ width: "60px" }}>
                                                        <img
                                                            src={item.product?.image || '/images/default-product.png'}
                                                            alt={item.product?.name}
                                                            className="rounded"
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', backgroundColor: '#f8f9fa' }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/images/default-product.png';
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <p className="mb-0 fw-medium">
                                                            {item.product?.name || 'Sản phẩm không còn tồn tại'}
                                                        </p>
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">{this.formatCurrency(item.price || item.product?.price || 0)}</td>
                                                    <td className="text-end fw-bold">{this.formatCurrency((item.price || item.product?.price || 0) * item.quantity)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-light">
                                                <td colSpan="4" className="text-end fw-bold">Tổng cộng:</td>
                                                <td className="text-end fw-bold text-success fs-5">
                                                    {this.formatCurrency(this.calculateOrderTotal(selectedOrder.items))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </Modal.Body>

                    <Modal.Footer className="border-top-0 bg-light">
                        <Button
                            variant="outline-secondary"
                            onClick={() => this.setState({ showOrderDetailModal: false })}
                            className="btn-with-icon"
                        >
                            <FaTimes className="btn-icon" />
                            <span>Đóng</span>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

export default Customer;

