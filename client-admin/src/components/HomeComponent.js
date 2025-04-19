import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { FaShoppingCart, FaUsers, FaBox, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import MyContext from '../contexts/MyContext';
import axios from 'axios';
import '../styles/HomeComponent.css';


const calculateOrderTotal = (items, shippingFee = 0) => {
  if (!items || !Array.isArray(items)) return 0;
  const subtotal = items.reduce((total, item) => {
    const quantity = item?.quantity || 0;
    const price = item?.price || 0;
    return total + (quantity * price);
  }, 0);
  return subtotal;
};

const calculateFinalTotal = (order) => {
  if (!order) return 0;
  
  // If the order already has a 'total' field, use that directly
  if (order.total) return order.total;
  
  const subtotal = calculateOrderTotal(order.items);
  
  // Use the shipping fee that's already included in the order
  return subtotal + (order.shippingFee || 0);
};

const statusMap = {
  'pending': 'Chờ xử lý',
  'processing': 'Đang xử lý',
  'shipping': 'Đang giao',
  'delivered': 'Đã giao',
  'cancelled': 'Đã hủy'
};
const Home = () => {
  const context = useContext(MyContext);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalCustomers: 0,
    totalOrders: 0,
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 7;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${context.apiUrl}/admin/dashboard`, {
        headers: { 'x-access-token': context.token }
      });

      if (response.data.success) {
        // Log data structure to understand the format
        console.log('Dashboard data received:', response.data.stats);
        if (response.data.stats.recentOrders && response.data.stats.recentOrders.length > 0) {
          console.log('Sample recent order:', response.data.stats.recentOrders[0]);
        }
        
        setStats(response.data.stats);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // Cập nhật mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  const getCurrentOrders = () => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return stats.recentOrders.slice(startIndex, startIndex + ordersPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const StatCard = ({ title, value, icon, color, percentChange }) => (
    <Card className="stat-card h-100">
      <Card.Body>
        <div className={`stat-icon-container bg-${color}`}>
          {icon}
        </div>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <>
            <h3 className="stat-value">
              {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </h3>
            <p className="stat-title">{title}</p>
            {percentChange !== undefined && (
              <div className={`percent-change ${percentChange > 0 ? 'positive' : 'negative'}`}>
                {percentChange > 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                <span>{Math.abs(percentChange)}% so với tháng trước</span>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );

  if (error) {
    return (
      <div className="dashboard-container">
        <Container fluid>
          <div className="alert alert-danger d-flex align-items-center">
            <FaChartLine className="me-2" size={20} />
            <div>
              <h5 className="alert-heading mb-1">Lỗi tải dữ liệu</h5>
              <p className="mb-0">{error}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Container fluid>
        {/* Welcome Section */}
        <div className="welcome-section mb-4">
          <h2>
            <GiFlowerPot className="me-2" />
            Chào mừng, {context.username}!
          </h2>
          <p className="text-muted">
            Hôm nay là ngày {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Statistics Cards */}
        <Row className="g-4 mb-4">
          <Col md={6} xl={3}>
            <StatCard
              title="Tổng Sản Phẩm"
              value={stats.totalProducts}
              icon={<FaBox />}
              color="primary"
              percentChange={12}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Đơn Hàng"
              value={stats.totalOrders}
              icon={<FaShoppingCart />}
              color="success"
              percentChange={-5}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Khách Hàng"
              value={stats.totalCustomers}
              icon={<FaUsers />}
              color="info"
              percentChange={8}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Danh Mục"
              value={stats.totalCategories}
              icon={<GiFlowerPot />}
              color="warning"
            />
          </Col>
        </Row>

        {/* Recent Orders & Top Products */}
        <Row className="g-4">
          <Col lg={8}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-transparent border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaShoppingCart className="me-2" />
                    Đơn Hàng Gần Đây
                  </h5>
                  {loading && <Spinner animation="border" size="sm" />}
                </div>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Mã Đơn</th>
                        <th>Khách Hàng</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentOrders().map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.customer}</td>
                          <td>{new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(calculateFinalTotal(order))}</td>
                          <td>

                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                              {statusMap[order.status.toLowerCase()] || order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {stats.recentOrders.length === 0 && !loading && (
                        <tr>
                          <td colSpan="4" className="text-center py-4">
                            <p className="text-muted mb-0">Chưa có đơn hàng nào</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {stats.recentOrders.length > ordersPerPage && (
                  <div className="d-flex justify-content-center mt-3">
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            &laquo;
                          </button>
                        </li>
                        {Array.from({
                          length: Math.ceil((stats.recentOrders?.length || 0) / ordersPerPage)
                        }).map((_, index) => (
                          <li
                            key={index + 1}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === Math.ceil((stats.recentOrders?.length || 0) / ordersPerPage)
                          ? 'disabled'
                          : ''
                          }`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === Math.ceil((stats.recentOrders?.length || 0) / ordersPerPage)}
                          >
                            &raquo;
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-transparent border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaChartLine className="me-2" />
                    Sản Phẩm Bán Chạy
                  </h5>
                  {loading && <Spinner animation="border" size="sm" />}
                </div>
              </Card.Header>
              <Card.Body>
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="top-product-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{product.name}</h6>
                        <small className="text-muted">
                          {product.sales} đơn hàng
                        </small>
                      </div>
                      <div className="progress-circle">
                        <span>
                          {Math.round((product.sales / Math.max(...stats.topProducts.map(p => p.sales))) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.topProducts.length === 0 && !loading && (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">Chưa có dữ liệu bán hàng</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;
