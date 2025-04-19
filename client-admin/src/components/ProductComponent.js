import React, { Component } from 'react';
import axios from 'axios';
import MyContext from '../contexts/MyContext';
import ProductDetail from './ProductDetailComponent';
import { Table, Container, Row, Col, Pagination, Card, Badge, Spinner, Form, Button } from 'react-bootstrap';
import { FaDollarSign, FaCalendar, FaSort, FaTimes, FaFilter } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import { toast } from 'react-toastify';
import '../styles/ProductComponent.css';

class Product extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      products: [],
      categories: [],
      noPages: 0,
      curPage: 1,
      itemSelected: null,
      isLoading: false,
      isCategoriesLoading: true,
      filters: {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        startDate: '',
        endDate: ''
      },
      sort: {
        field: 'cdate',
        order: 'desc'
      },
      showAdvancedFilters: false,
      debounceTimeout: null,
      error: null
    };
  }

  componentDidMount() {
    this.loadCategories();
    this.loadProducts(1);
  }

  debounceSearch = (searchTerm) => {
    if (this.state.debounceTimeout) {
      clearTimeout(this.state.debounceTimeout);
    }
    const timeout = setTimeout(() => {
      this.handleFilterChange('search', searchTerm.trim());
    }, 300);
    this.setState({ debounceTimeout: timeout });
  };

  loadCategories = async () => {
    try {
      const response = await axios.get(`${this.context.apiUrl}/admin/categories`, {
        headers: { 'x-access-token': this.context.token }
      });

      if (response.data.success && Array.isArray(response.data.categories)) {
        this.setState({
          categories: response.data.categories,
          isCategoriesLoading: false,
          error: null
        });
      } else {
        throw new Error('Invalid categories response');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Không thể tải danh mục hoa');
      this.setState({
        categories: [],
        isCategoriesLoading: false,
        error: 'Không thể tải danh mục hoa'
      });
    }
  };

  loadProducts = async (page) => {
    // Loại bỏ điều kiện kiểm tra isLoading tại đây
    // if (this.state.isLoading) return;

    try {
      const { filters, sort } = this.state;
      const params = {
        page,
        limit: 10,
        sort: sort.field,
        order: sort.order,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value.toString().trim())
        )
      };

      this.setState({ isLoading: true });

      const { data } = await axios.get(`${this.context.apiUrl}/admin/products`, {
        headers: { 'x-access-token': this.context.token },
        params
      });

      if (data.success) {
        this.setState({
          products: data.products,
          noPages: data.noPages,
          curPage: page,
          error: null
        });
      } else {
        toast.error('Lỗi: ' + (data.message || 'Không thể tải dữ liệu'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Lỗi tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleFilterChange = (filterName, value) => {
    this.setState(prevState => ({
      filters: {
        ...prevState.filters,
        [filterName]: value
      },
      curPage: 1
    }), () => this.loadProducts(1));
  };

  handleSort = (field) => {
    if (this.state.isLoading) return;

    this.setState(prevState => {
      const newOrder = prevState.sort.field === field ? (prevState.sort.order === 'asc' ? 'desc' : 'asc') : 'asc';

      return {
        sort: {
          field,
          order: newOrder
        },
        curPage: 1
      };
    }, () => {
      this.loadProducts(1);
      const sortDescription = {
        name: `tên hoa ${this.state.sort.order === 'asc' ? 'A-Z' : 'Z-A'}`,
        price: `giá ${this.state.sort.order === 'asc' ? 'thấp đến cao' : 'cao đến thấp'}`,
        cdate: `ngày ${this.state.sort.order === 'asc' ? 'cũ nhất' : 'mới nhất'}`
      }[field];
      toast.success(`Đã sắp xếp theo ${sortDescription}`);
    });
  };

  resetFilters = () => {
    this.setState({
      filters: {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        startDate: '',
        endDate: ''
      },
      curPage: 1,
      showAdvancedFilters: false
    }, () => {
      this.loadProducts(1);
      toast.info('Đã xóa tất cả bộ lọc');
    });
  };

  handlePageClick = (page) => {
    if (page === this.state.curPage || this.state.isLoading) return;

    this.setState({
      curPage: page
      // Loại bỏ isLoading: true tại đây để tránh xung đột
    }, () => this.loadProducts(page));
  };

  trItemClick = (item) => {
    if (!this.state.isLoading) {
      this.setState({ itemSelected: item });
      toast.info(`Đã chọn hoa: ${item.name}`);
    }
  };

  renderPagination = () => {
    const { noPages, curPage, isLoading } = this.state;
    if (noPages <= 1) return null;

    return (
      <Pagination className="mb-0 flower-pagination">
        <Pagination.First
          onClick={() => this.handlePageClick(1)}
          disabled={curPage === 1 || isLoading}
        />
        <Pagination.Prev
          onClick={() => this.handlePageClick(curPage - 1)}
          disabled={curPage === 1 || isLoading}
        />
        {Array.from({ length: noPages }, (_, i) => i + 1).map(page => (
          <Pagination.Item
            key={page}
            active={page === curPage}
            onClick={() => this.handlePageClick(page)}
            disabled={isLoading}
          >
            {page}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => this.handlePageClick(curPage + 1)}
          disabled={curPage === noPages || isLoading}
        />
        <Pagination.Last
          onClick={() => this.handlePageClick(noPages)}
          disabled={curPage === noPages || isLoading}
        />
      </Pagination>
    );
  };

  render() {
    const {
      products,
      categories,
      isLoading,
      isCategoriesLoading,
      filters,
      sort,
      showAdvancedFilters
    } = this.state;

    return (
      <div className="product-page">
        <Container fluid>
          <Row className="g-4">
            <Col lg={8}>
              <Card className="shadow-sm border-0">
                <Card.Header className="flower-gradient text-white py-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <GiFlowerPot size={24} className="me-2" />
                      <h5 className="mb-0">Quản Lý Hoa Tươi</h5>
                    </div>
                    <Badge bg="light" text="dark" pill>
                      {products.length} sản phẩm
                    </Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Select
                        value={filters.category}
                        onChange={(e) => this.handleFilterChange('category', e.target.value)}
                        className="flower-select"
                        disabled={isCategoriesLoading || isLoading}
                      >
                        <option value="">Tất cả loại hoa</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={8}>
                      <div className="search-group">
                        <Form.Control
                          type="text"
                          placeholder="Tìm kiếm theo tên hoa..."
                          value={filters.search}
                          onChange={(e) => this.debounceSearch(e.target.value)}
                          className="flower-input"
                          disabled={isLoading}
                        />
                        {filters.search && (
                          <Button
                            variant="link"
                            className="clear-search"
                            onClick={() => this.handleFilterChange('search', '')}
                            disabled={isLoading}
                            title="Xóa tìm kiếm"
                          >
                            <FaTimes size={14} />
                          </Button>
                        )}
                      </div>
                    </Col>

                    {showAdvancedFilters && (
                      <>
                        <Col md={6}>
                          <div className="price-range">
                            <Form.Control
                              type="number"
                              placeholder="Giá từ"
                              value={filters.minPrice}
                              onChange={(e) => this.handleFilterChange('minPrice', e.target.value)}
                              className="flower-input"
                              disabled={isLoading}
                            />
                            <Form.Control
                              type="number"
                              placeholder="Giá đến"
                              value={filters.maxPrice}
                              onChange={(e) => this.handleFilterChange('maxPrice', e.target.value)}
                              className="flower-input"
                              disabled={isLoading}
                            />
                          </div>
                        </Col>
                      </>
                    )}

                    <Col md={12} className="d-flex justify-content-between align-items-center">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => this.setState(prev => ({
                          showAdvancedFilters: !prev.showAdvancedFilters
                        }))}
                        className="me-2"
                      >
                        <FaFilter className="me-1" />
                        {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                      </Button>

                      {Object.values(filters).some(Boolean) && (
                        <Button
                          variant="light"
                          size="sm"
                          onClick={this.resetFilters}
                          disabled={isLoading}
                        >
                          <FaTimes className="me-1" />
                          Xóa bộ lọc
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Header>

                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th onClick={() => this.handleSort('name')} className="sortable-header">
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Tên Hoa</span>
                            <FaSort className={sort.field === 'name' ? sort.order : 'text-muted'} />
                          </div>
                        </th>
                        <th onClick={() => this.handleSort('price')} className="sortable-header">
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Giá Bán</span>
                            <FaSort className={sort.field === 'price' ? sort.order : 'text-muted'} />
                          </div>
                        </th>
                        <th>Danh Mục</th>
                        <th onClick={() => this.handleSort('cdate')} className="sortable-header">
                          <div className="d-flex align-items-center justify-content-between">
                            <span>Ngày Cập Nhật</span>
                            <FaSort className={sort.field === 'cdate' ? sort.order : 'text-muted'} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5">
                            <Spinner animation="border" className="flower-spinner" />
                          </td>
                        </tr>
                      ) : products.length > 0 ? (
                        products.map((item) => (
                          <tr
                            key={item._id}
                            onClick={() => this.trItemClick(item)}
                            className="flower-row"
                          >
                            <td>
                              <div className="d-flex align-items-center">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="product-image rounded"
                                    loading="lazy"
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      objectFit: 'cover',
                                      border: '2px solid #fff',
                                      backgroundColor: '#f8f9fa' // Thêm background màu nhạt khi đang load
                                    }}
                                    onLoad={(e) => e.target.classList.add('loaded')} // Thêm class khi ảnh load xong
                                  />
                                ) : (
                                  <div className="no-image-placeholder rounded">
                                    <GiFlowerPot size={24} className="text-muted" />
                                  </div>
                                )}
                                <span className="ms-3">{item.name}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flower-price">
                                <FaDollarSign size={14} />
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(item.price)}
                              </div>
                            </td>
                            <td>
                              <Badge className="flower-category">
                                {item.category?.name || 'Chưa phân loại'}
                              </Badge>
                            </td>
                            <td>
                              <div className="flower-date">
                                <FaCalendar size={14} className="me-2" />
                                {item.cdate
                                  ? new Date(item.cdate).toLocaleDateString('vi-VN')
                                  : new Date().toLocaleDateString('vi-VN')}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-5">
                            <div className="empty-state">
                              <GiFlowerPot size={48} className="mb-3" />
                              <p>Không tìm thấy sản phẩm hoa nào</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {this.renderPagination() && (
                  <Card.Footer className="d-flex justify-content-center py-3">
                    {this.renderPagination()}
                  </Card.Footer>
                )}
              </Card>
            </Col>

            <Col lg={4}>
              <div className="sticky-top" style={{ top: '1.5rem' }}>
                <ProductDetail
                  item={this.state.itemSelected}
                  updateProducts={() => this.loadProducts(this.state.curPage)}
                  categories={categories}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Product;