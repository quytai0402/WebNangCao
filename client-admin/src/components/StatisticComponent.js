import React, { Component } from 'react';
import { Container, Row, Col, Card, Table, Form, Badge, Spinner, Button } from 'react-bootstrap';
import { Bar, Line, Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
    FaChartLine, FaFilter, FaCalendar, FaMoneyBillWave,
    FaChartPie, FaChartBar, FaShoppingCart, FaBoxOpen,
    FaUsers, FaUserTag, FaThList, FaFileExport
} from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import { Chart as ChartJS, registerables } from 'chart.js';
import MyContext from '../contexts/MyContext';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(...registerables);

class Statistic extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            exporting: false,
            periodFilter: 'month',
            dateRange: {
                startDate: this.getDefaultStartDate(),
                endDate: this.formatDateForInput(new Date())
            },
            revenue: {
                labels: [],
                datasets: []
            },
            topProducts: [],
            topCategories: [],
            orderStats: {
                pending: 0,
                processing: 0,
                shipping: 0,
                delivered: 0,
                cancelled: 0,
                total: 0
            },
            generalStats: {
                totalRevenue: 0,
                totalOrders: 0,
                totalProducts: 0,
                totalCustomers: 0,
                avgOrderValue: 0
            }
        };
    }
    exportPDF = async () => {
        try {
            this.setState({ exporting: true });
            toast.info('Đang chuẩn bị tài liệu PDF...');

            const { dateRange } = this.state;

            // Check if the API endpoint exists
            if (!process.env.REACT_APP_API_URL && !window.location.origin.includes('localhost')) {
                throw new Error('API URL không hợp lệ');
            }

            // Gọi API để tạo PDF
            const response = await axios.get(
                `/api/admin/statistics/export`,
                {
                    headers: {
                        'x-access-token': this.context.token,
                        'Accept': 'application/pdf'
                    },
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                        format: 'pdf'
                    },
                    responseType: 'blob'
                }
            );

            // Kiểm tra phản hồi
            if (response.status !== 200) {
                throw new Error(`Lỗi server: ${response.status}`);
            }

            // Kiểm tra loại file trong phản hồi
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.includes('application/pdf')) {
                console.warn('Content-Type không phải PDF:', contentType);
            }

            // Tạo URL cho blob và tải xuống
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `thong-ke-${dateRange.startDate}-den-${dateRange.endDate}.pdf`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            toast.success('Xuất PDF thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);

            // Thông báo chi tiết hơn về lỗi
            let errorMessage = 'Không thể xuất PDF. ';

            if (error.response) {
                // Lỗi từ server
                errorMessage += `Mã lỗi: ${error.response.status}`;
                if (error.response.data instanceof Blob) {
                    // Đọc nội dung lỗi từ Blob
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorData = JSON.parse(reader.result);
                            toast.error(`Lỗi server: ${errorData.message || 'Không xác định'}`);
                        } catch (e) {
                            toast.error('Không thể đọc thông báo lỗi từ server');
                        }
                    };
                    reader.readAsText(error.response.data);
                }
            } else if (error.request) {
                // Không nhận được phản hồi
                errorMessage += 'Không nhận được phản hồi từ server';
            } else {
                // Lỗi khi thiết lập request
                errorMessage += error.message || 'Vui lòng thử lại sau';
            }

            toast.error(errorMessage);
        } finally {
            this.setState({ exporting: false });
        }
    }
    componentDidMount() {
        this.fetchStatistics();
    }

    formatDateForInput(date) {
        return date.toISOString().slice(0, 10);
    }

    getDefaultStartDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return this.formatDateForInput(date);
    }

    handlePeriodChange = (e) => {
        const period = e.target.value;
        let startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
        }

        this.setState({
            periodFilter: period,
            dateRange: {
                ...this.state.dateRange,
                startDate: this.formatDateForInput(startDate)
            }
        }, this.fetchStatistics);
    }

    handleDateChange = (e) => {
        const { name, value } = e.target;
        this.setState({
            dateRange: {
                ...this.state.dateRange,
                [name]: value
            }
        }, () => {
            if (this.state.periodFilter === 'custom') {
                this.fetchStatistics();
            }
        });
    }

    fetchStatistics = async () => {
        this.setState({ loading: true });
        try {
            const { startDate, endDate } = this.state.dateRange;

            // API call to fetch statistics data
            const response = await axios.get('/api/admin/statistics', {
                headers: { 'x-access-token': this.context.token },
                params: { startDate, endDate }
            });

            if (response.data.success) {
                const {
                    revenueData, topProducts, topCategories,
                    orderStats, generalStats
                } = response.data;

                this.setState({
                    revenue: this.prepareRevenueData(revenueData),
                    topProducts,
                    topCategories,
                    orderStats,
                    generalStats,
                    loading: false
                });
            } else {
                toast.error(response.data.message || 'Không thể tải dữ liệu thống kê');
                this.setState({ loading: false });
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
            toast.error(error.response?.data?.message || 'Không thể kết nối tới server');
            this.setState({ loading: false });
        }
    }

    prepareRevenueData(data) {
        return {
            labels: data.map(item => item.date),
            datasets: [{
                label: 'Doanh thu',
                data: data.map(item => item.revenue),
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                borderColor: 'rgba(255, 107, 107, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    }

    exportStatistics = () => {
        const { generalStats, orderStats, topProducts, topCategories, dateRange, revenue } = this.state;

        try {
            // Add BOM for UTF-8 encoding
            let csvContent = '\uFEFF';

            // Title and Period
            csvContent += "BÁO CÁO THỐNG KÊ DOANH THU VÀ BÁN HÀNG\n";
            csvContent += `Kỳ báo cáo: ${dateRange.startDate} - ${dateRange.endDate}\n`;
            csvContent += "Đơn vị: Florista Flowers\n";
            csvContent += "Địa chỉ: 123 Đường Hoa, Quận 1, TP.HCM\n\n";

            // General Stats Section
            csvContent += "1. THÔNG TIN CHUNG\n";
            csvContent += "Chỉ tiêu,Giá trị\n";
            csvContent += `Tổng doanh thu,${this.formatCurrency(generalStats.totalRevenue)}\n`;
            csvContent += `Tổng đơn hàng,${orderStats.total} đơn\n`;
            csvContent += `Tổng khách hàng,${generalStats.totalCustomers} khách hàng\n`;
            csvContent += `Giá trị đơn hàng trung bình,${this.formatCurrency(generalStats.avgOrderValue)}\n\n`;

            // Order Stats Section
            csvContent += "2. TRẠNG THÁI ĐƠN HÀNG\n";
            csvContent += "Trạng thái,Số lượng,Tỷ lệ\n";
            csvContent += `Chờ xử lý,${orderStats.pending},${((orderStats.pending / orderStats.total) * 100).toFixed(1)}%\n`;
            csvContent += `Đang xử lý,${orderStats.processing},${((orderStats.processing / orderStats.total) * 100).toFixed(1)}%\n`;
            csvContent += `Đang giao,${orderStats.shipping},${((orderStats.shipping / orderStats.total) * 100).toFixed(1)}%\n`;
            csvContent += `Đã giao,${orderStats.delivered},${((orderStats.delivered / orderStats.total) * 100).toFixed(1)}%\n`;
            csvContent += `Đã hủy,${orderStats.cancelled},${((orderStats.cancelled / orderStats.total) * 100).toFixed(1)}%\n\n`;

            // Revenue Data Section
            csvContent += "3. DOANH THU THEO THỜI GIAN\n";
            csvContent += "Ngày,Doanh thu,So với ngày trước\n";
            revenue.labels.forEach((date, index) => {
                const currentRevenue = revenue.datasets[0].data[index];
                const previousRevenue = index > 0 ? revenue.datasets[0].data[index - 1] : currentRevenue;
                const change = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
                csvContent += `${date},${this.formatCurrency(currentRevenue)},${change}%\n`;
            });
            csvContent += "\n";

            // Top Products Section
            csvContent += "4. TOP SẢN PHẨM BÁN CHẠY\n";
            csvContent += "STT,Tên sản phẩm,Số lượng đã bán,Doanh thu,Tỷ trọng doanh thu\n";
            topProducts.forEach((product, index) => {
                const percentage = ((product.revenue / generalStats.totalRevenue) * 100).toFixed(1);
                csvContent += `${index + 1},"${product.name}",${product.quantity},${this.formatCurrency(product.revenue)},${percentage}%\n`;
            });
            csvContent += "\n";

            // Top Categories Section
            csvContent += "5. PHÂN BỐ DANH MỤC SẢN PHẨM\n";
            csvContent += "STT,Tên danh mục,Số lượng sản phẩm,Tỷ trọng\n";
            const totalProducts = topCategories.reduce((sum, cat) => sum + cat.count, 0);
            topCategories.forEach((category, index) => {
                const percentage = ((category.count / totalProducts) * 100).toFixed(1);
                csvContent += `${index + 1},"${category.name}",${category.count},${percentage}%\n`;
            });

            // Footer
            csvContent += "\nBáo cáo được tạo tự động từ hệ thống\n";
            csvContent += `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`;

            // Create and download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `bao-cao-thong-ke-${dateRange.startDate}-den-${dateRange.endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Đã xuất báo cáo thống kê thành công!');
        } catch (error) {
            console.error('Error exporting statistics:', error);
            toast.error('Không thể xuất thống kê. Vui lòng thử lại!');
        }
    }


    render() {
        const {
            loading, periodFilter, dateRange,
            revenue, topProducts, topCategories,
            orderStats, generalStats
        } = this.state;

        // Chart options
        const lineOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Biểu đồ doanh thu theo thời gian',
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => this.formatCurrency(value)
                    }
                }
            }
        };

        const pieOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Phân bố đơn hàng',
                }
            }
        };

        // Prepare order distribution data
        const orderDistributionData = {
            labels: ['Chờ xử lý', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'],
            datasets: [
                {
                    data: [
                        orderStats.pending,
                        orderStats.processing,
                        orderStats.shipping,
                        orderStats.delivered,
                        orderStats.cancelled
                    ],
                    backgroundColor: [
                        '#ffc107',
                        '#17a2b8',
                        '#007bff',
                        '#28a745',
                        '#dc3545'
                    ],
                    borderWidth: 1
                },
            ],
        };

        // Prepare category distribution data
        const categoryData = {
            labels: topCategories.map(item => item.name),
            datasets: [
                {
                    label: 'Số lượng sản phẩm',
                    data: topCategories.map(item => item.count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                    ],
                    borderWidth: 1
                },
            ],
        };

        return (
            <Container fluid>
                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="flower-gradient text-white py-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center">
                                <FaChartLine className="me-2" size={24} />
                                <h5 className="mb-0">Thống kê doanh thu &amp; bán hàng</h5>
                            </div>

                            {!loading && (
                                <div className="d-flex">
                                    <Button
                                        variant="light"
                                        size="sm"
                                        className="export-btn"
                                        onClick={this.exportPDF}
                                        disabled={loading || this.state.exporting}
                                    >
                                        {this.state.exporting ? (
                                            <>
                                                <Spinner size="sm" animation="border" className="me-1" />
                                                Đang xuất...
                                            </>
                                        ) : (
                                            <>
                                                <FaFileExport className="me-1" /> Xuất PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Row className="g-2">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Select
                                        size="sm"
                                        value={periodFilter}
                                        onChange={this.handlePeriodChange}
                                        className="border-0 shadow-sm"
                                    >
                                        <option value="week">7 ngày qua</option>
                                        <option value="month">30 ngày qua</option>
                                        <option value="quarter">3 tháng qua</option>
                                        <option value="year">1 năm qua</option>
                                        <option value="custom">Tùy chỉnh</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {periodFilter === 'custom' && (
                                <>
                                    <Col md={4}>
                                        <Form.Group className="d-flex align-items-center">
                                            <FaCalendar className="me-2 text-white opacity-75" />
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                name="startDate"
                                                value={dateRange.startDate}
                                                onChange={this.handleDateChange}
                                                className="border-0 shadow-sm"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={4}>
                                        <Form.Group className="d-flex align-items-center">
                                            <FaCalendar className="me-2 text-white opacity-75" />
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                name="endDate"
                                                value={dateRange.endDate}
                                                onChange={this.handleDateChange}
                                                className="border-0 shadow-sm"
                                            />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card.Header>

                    {loading ? (
                        <Card.Body className="text-center py-5">
                            <Spinner animation="border" className="flower-spinner" />
                            <p className="mt-3">Đang tải dữ liệu thống kê...</p>
                        </Card.Body>
                    ) : (
                        <>
                            <Card.Body>
                                <Row className="gy-4">
                                    <Col md={4}>
                                        <div className="stat-card shadow-sm rounded p-3 h-100 border-left-primary">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="stat-icon-container bg-primary">
                                                    <FaMoneyBillWave />
                                                </div>
                                                <div className="ms-3">
                                                    <h6 className="mb-0">Tổng doanh thu</h6>
                                                    <small className="text-muted">Chỉ tính đơn hàng đã giao</small>
                                                </div>
                                            </div>
                                            <h3 className="mb-0">{this.formatCurrency(generalStats.totalRevenue)}</h3>
                                            <div className="progress mt-2" style={{ height: '5px' }}>
                                                <div
                                                    className="progress-bar bg-primary"
                                                    style={{ width: '100%' }}
                                                ></div>
                                            </div>
                                            <small className="text-muted mt-1 d-block">
                                                {orderStats.delivered} đơn hàng đã hoàn thành
                                            </small>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="stat-card shadow-sm rounded p-3 h-100 border-left-success">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="stat-icon-container bg-success">
                                                    <FaShoppingCart />
                                                </div>
                                                <div className="ms-3">
                                                    <h6 className="mb-0">Đơn hàng</h6>
                                                    <small className="text-muted">Tổng số đơn hàng</small>
                                                </div>
                                            </div>
                                            <h3 className="mb-0">{orderStats.total}</h3>
                                            <div className="progress mt-2" style={{ height: '5px' }}>
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${(orderStats.delivered / orderStats.total) * 100}%` }}
                                                ></div>
                                            </div>
                                            <small className="text-muted mt-1 d-block">
                                                {orderStats.delivered} đơn hàng đã giao thành công
                                            </small>
                                        </div>
                                    </Col>

                                    <Col md={4}>
                                        <div className="stat-card shadow-sm rounded p-3 h-100 border-left-info">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="stat-icon-container bg-info">
                                                    <FaUsers />
                                                </div>
                                                <div className="ms-3">
                                                    <h6 className="mb-0">Khách hàng</h6>
                                                    <small className="text-muted">Tổng số khách hàng</small>
                                                </div>
                                            </div>
                                            <h3 className="mb-0">{generalStats.totalCustomers}</h3>
                                            <div className="progress mt-2" style={{ height: '5px' }}>
                                                <div
                                                    className="progress-bar bg-info"
                                                    style={{ width: '100%' }}
                                                ></div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <Row className="mt-4">
                                    <Col lg={8}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white py-3">
                                                <div className="d-flex align-items-center">
                                                    <FaChartBar className="text-primary me-2" />
                                                    <h6 className="mb-0">Doanh thu theo thời gian</h6>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <div style={{ height: '300px' }}>
                                                    <Line data={revenue} options={lineOptions} />
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col lg={4}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white py-3">
                                                <div className="d-flex align-items-center">
                                                    <FaChartPie className="text-warning me-2" />
                                                    <h6 className="mb-0">Trạng thái đơn hàng</h6>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <div style={{ height: '300px', position: 'relative' }}>
                                                    <Pie data={orderDistributionData} options={pieOptions} />
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="mt-4">
                                    <Col md={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white py-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <FaBoxOpen className="text-danger me-2" />
                                                        <h6 className="mb-0">Top sản phẩm bán chạy</h6>
                                                    </div>
                                                    <Badge bg="light" text="dark" pill>
                                                        {topProducts.length} sản phẩm
                                                    </Badge>
                                                </div>
                                            </Card.Header>
                                            <Card.Body className="p-0">
                                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    <Table hover className="mb-0">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th>Sản phẩm</th>
                                                                <th className="text-center">Đã bán</th>
                                                                <th className="text-end">Doanh thu</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topProducts.length > 0 ? (
                                                                topProducts.map((product, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <div className="d-flex align-items-center">
                                                                                <img
                                                                                    src={product.image || '/images/default-product.png'}
                                                                                    alt={product.name}
                                                                                    className="rounded"
                                                                                    style={{
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        objectFit: 'cover',
                                                                                        marginRight: '8px'
                                                                                    }}
                                                                                    onError={(e) => {
                                                                                        e.target.onerror = null;
                                                                                        e.target.src = "/images/default-product.png";
                                                                                    }}
                                                                                />
                                                                                <span className="fw-medium">{product.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            {product.quantity}
                                                                        </td>
                                                                        <td className="text-end fw-medium">
                                                                            {this.formatCurrency(product.revenue)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="3" className="text-center py-3">
                                                                        Không có dữ liệu
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col md={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header className="bg-white py-3">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center">
                                                        <GiFlowerPot className="text-success me-2" size={18} />
                                                        <h6 className="mb-0">Phân bố theo danh mục</h6>
                                                    </div>
                                                    <Badge bg="light" text="dark" pill>
                                                        {topCategories.length} danh mục
                                                    </Badge>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                <div style={{ height: '300px' }}>
                                                    <Bar
                                                        data={categoryData}
                                                        options={{
                                                            responsive: true,
                                                            indexAxis: 'y',
                                                            plugins: {
                                                                legend: {
                                                                    display: false,
                                                                },
                                                            },
                                                            scales: {
                                                                x: {
                                                                    beginAtZero: true
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </>
                    )}
                </Card>

                <style jsx>{`
          .stat-icon-container {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
          }
          
          .flower-gradient {
            // background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
          }
          
          .flower-spinner {
            color: #FF6B6B;
          }
          
          .border-left-primary {
            border-left: 4px solid #4e73df !important;
          }
          
          .border-left-success {
            border-left: 4px solid #1cc88a !important;
          }
          
          .border-left-info {
            border-left: 4px solid #36b9cc !important;
          }
          
          .export-btn {
            font-weight: 500;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
          }
          
          .export-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .table-responsive::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .table-responsive::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.2);
            border-radius: 4px;
          }
          
          .table-responsive::-webkit-scrollbar-track {
            background-color: rgba(0,0,0,0.05);
          }
        `}</style>
            </Container>
        );
    }
}

export default Statistic;