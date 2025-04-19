import React, { Component } from 'react'; // Nhập thư viện React và Component từ React
import axios from 'axios'; // Nhập thư viện axios để thực hiện các yêu cầu HTTP
import { Link } from 'react-router-dom'; // Nhập component Link từ react-router-dom để điều hướng
import { FaLeaf } from 'react-icons/fa'; // Nhập biểu tượng lá từ react-icons
import ProductComponent from './ProductComponent'; // Nhập component hiển thị sản phẩm
import { toast } from 'react-toastify'; // Nhập thư viện toastify để hiển thị thông báo
import '../styles/AllProductsComponent.css'; // Nhập file CSS cho component này
import CartService from './services/CartService'; // Nhập dịch vụ giỏ hàng
import MyContext from '../contexts/MyContext'; // Nhập context để quản lý trạng thái
import { FaFilter, FaSortAmountDown, FaSearch, FaCaretDown, FaTimes, FaInfoCircle } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

// Lấy URL API từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com/api';

class AllProducts extends Component {
    static contextType = MyContext; // Xác định context mà component sẽ sử dụng

    constructor(props) {
        super(props); // Gọi hàm khởi tạo của lớp cha
        this.state = {
            products: [], // Danh sách sản phẩm
            filteredProducts: [],
            isLoading: true, // Trạng thái loading mặc định là true
            error: null, // Biến lưu trữ lỗi nếu có
            productType: null, // Loại sản phẩm (new, hot)
            title: "Tất Cả Sản Phẩm", // Tiêu đề mặc định
            currentPage: 1, // Trang hiện tại
            productsPerPage: 10, // Số sản phẩm trên mỗi trang
            categories: [],
            selectedCategory: '',
            price: {
                min: '',
                max: ''
            },
            sort: 'dateDesc',
            showMobileFilter: false
        };
    }

    componentDidMount() {
        // Hàm này được gọi ngay sau khi component được gắn vào DOM

        // Lấy loại sản phẩm từ URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'all'; // all, new, hot
        const all = urlParams.get('all') === 'true'; // boolean indicator for all products
        const page = parseInt(urlParams.get('page')) || 1; // Lấy số trang từ tham số, mặc định là 1
        
        let title = "Tất Cả Sản Phẩm"; // Thiết lập tiêu đề mặc định
        if (type === 'new') {
            title = "Sản Phẩm Mới"; // Nếu loại sản phẩm là mới
        } else if (type === 'hot') {
            title = "Sản Phẩm Bán Chạy"; // Nếu loại sản phẩm là bán chạy
        }
        
        this.setState({ 
            productType: type, // Cập nhật trạng thái loại sản phẩm
            title,
            showAllProducts: all, // Kiểm tra xem có cần hiển thị tất cả sản phẩm không
            currentPage: page // Cập nhật trang hiện tại
        }, () => {
            this.fetchCategories();
            this.fetchProducts(type, all);
        });
    }

    componentDidUpdate(prevProps) {
        // Hàm này được gọi khi props của component thay đổi
        // Kiểm tra sự thay đổi trong URL và cập nhật nếu cần
        const prevSearch = prevProps.location?.search || window.location.search; // Lấy search query trước đó
        const currentSearch = this.props.location?.search || window.location.search; // Lấy search query hiện tại

        if (prevSearch !== currentSearch) { // Nếu search query đã thay đổi
            const urlParams = new URLSearchParams(currentSearch);
            const type = urlParams.get('type') || 'all'; // all, new, hot
            const page = parseInt(urlParams.get('page')) || 1; // Lấy lại số trang

            let title = "Tất Cả Sản Phẩm";
            if (type === 'new') {
                title = "Sản Phẩm Mới"; // Cập nhật tiêu đề nếu loại là mới
            } else if (type === 'hot') {
                title = "Sản Phẩm Bán Chạy"; // Cập nhật tiêu đề nếu loại là bán chạy
            }

            this.setState({ 
                productType: type, // Cập nhật trạng thái loại sản phẩm
                title, 
                isLoading: true, // Đặt trạng thái loading thành true
                currentPage: page // Cập nhật trang hiện tại
            }, () => {
                this.fetchCategories();
                this.fetchProducts(type, this.state.showAllProducts);
            });
        }
    }

    fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/customer/categories`);
            this.setState({ categories: response.data || [] });
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    fetchProducts = async (type = 'all', all = false) => {
        this.setState({ isLoading: true, error: null });
        
        let endpoint;
        switch (type) {
            case 'new':
                endpoint = `${API_URL}/customer/products/new${all ? '?all=true' : ''}`;
                break;
            case 'hot':
                endpoint = `${API_URL}/customer/products/hot${all ? '?all=true' : ''}`;
                break;
            default:
                endpoint = `${API_URL}/customer/products`;
                break;
        }
        
        try {
            const response = await axios.get(endpoint);
            const products = response.data || [];
            
            this.setState({
                products,
                filteredProducts: products,
                isLoading: false,
                productType: type
            }, () => {
                this.applyFilters();
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            this.setState({
                error: 'Không thể tải danh sách sản phẩm',
                isLoading: false
            });
            toast.error('Lỗi khi tải danh sách sản phẩm');
        }
    };

    handleAddToCart = async (product) => {
        // Hàm xử lý thêm sản phẩm vào giỏ hàng
        try {
            const success = await CartService.addToCart(
                product,
                1,
                this.context.token // Lấy token từ context
            );
            if (success) {
                CartService.showSuccessToast(product.name); // Hiển thị thông báo thành công
                if (this.props.onCartUpdate) {
                    this.props.onCartUpdate(); // Gọi hàm callback nếu có
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng'); // Hiển thị thông báo lỗi
        }
    };

    handleAddToWishlist = async (productId) => {
        // Hàm xử lý thêm sản phẩm vào danh sách yêu thích
        if (!this.context.token) { // Kiểm tra nếu chưa đăng nhập
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích'); // Thông báo yêu cầu đăng nhập
            localStorage.setItem('returnUrl', window.location.pathname + window.location.search); // Lưu lại URL để trở về
            window.location.href = '/login'; // Điều hướng đến trang đăng nhập
            return;
        }

        try {
            const res = await axios.post('/api/customer/wishlist/add',
                { productId }, // Gửi productId
                { headers: { 'x-access-token': this.context.token } } // Thêm header với token
            );

            if (res.data) {
                toast.success('Đã thêm vào danh sách yêu thích!'); // Hiển thị thông báo thành công
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate(); // Gọi hàm callback nếu có
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào yêu thích'); // Hiển thị thông báo lỗi
        }
    };

    handlePageChange = (pageNumber) => {
        // Hàm để thay đổi trang
        const urlParams = new URLSearchParams(window.location.search); // Tạo đối tượng URLSearchParams từ query string
        urlParams.set('page', pageNumber); // Cập nhật tham số trang
        
        // Thêm lịch sử và cập nhật URL mà không làm mới trang
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`); 
        
        this.setState({ currentPage: pageNumber }); // Cập nhật trạng thái trang hiện tại
        
        // Cuộn lên đầu trang
        window.scrollTo(0, 0);
    };

    goToPrevPage = () => {
        // Hàm chuyển đến trang trước
        const { currentPage } = this.state;
        if (currentPage > 1) { // Nếu không phải trang đầu tiên
            this.handlePageChange(currentPage - 1); // Thay đổi sang trang trước
        }
    };

    goToNextPage = () => {
        // Hàm chuyển đến trang tiếp theo
        const { currentPage, products } = this.state;
        const totalPages = Math.ceil(products.length / this.state.productsPerPage); // Tính tổng số trang
        if (currentPage < totalPages) { // Nếu không phải trang cuối cùng
            this.handlePageChange(currentPage + 1); // Thay đổi sang trang tiếp theo
        }
    };

    handleCategoryChange = (e) => {
        this.setState({
            selectedCategory: e.target.value
        }, () => {
            this.applyFilters();
        });
    };

    handlePriceChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            price: {
                ...prevState.price,
                [name]: value
            }
        }));
    };

    handleSortChange = (e) => {
        this.setState({
            sort: e.target.value
        }, () => {
            this.applyFilters();
        });
    };

    clearFilters = () => {
        this.setState({
            selectedCategory: '',
            price: {
                min: '',
                max: ''
            },
            filteredProducts: this.state.products
        });
    };

    applyFilters = () => {
        const { products, selectedCategory, price, sort } = this.state;
        
        // Deep copy to avoid mutation
        let filteredProducts = [...products];
        
        // Apply category filter
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => 
                product.category && product.category._id === selectedCategory
            );
        }
        
        // Apply price filter
        if (price.min && !isNaN(price.min)) {
            filteredProducts = filteredProducts.filter(product => 
                product.price >= parseFloat(price.min)
            );
        }
        
        if (price.max && !isNaN(price.max)) {
            filteredProducts = filteredProducts.filter(product => 
                product.price <= parseFloat(price.max)
            );
        }
        
        // Apply sorting
        switch (sort) {
            case 'priceAsc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'priceDesc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'nameAsc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'dateDesc':
                // Newest first (default)
                filteredProducts.sort((a, b) => new Date(b.cdate) - new Date(a.cdate));
                break;
            case 'dateAsc':
                // Oldest first
                filteredProducts.sort((a, b) => new Date(a.cdate) - new Date(b.cdate));
                break;
            default:
                break;
        }
        
        this.setState({ filteredProducts });
    };

    handlePriceFilter = (e) => {
        e.preventDefault();
        this.applyFilters();
    };

    toggleMobileFilter = () => {
        this.setState(prevState => ({
            showMobileFilter: !prevState.showMobileFilter
        }));
    };

    getPageTitle = () => {
        const { productType } = this.state;
        switch (productType) {
            case 'new':
                return 'Sản Phẩm Mới';
            case 'hot':
                return 'Sản Phẩm Bán Chạy';
            default:
                return 'Tất Cả Sản Phẩm';
        }
    };

    getPageSubtitle = () => {
        const { productType } = this.state;
        switch (productType) {
            case 'new':
                return 'Những sản phẩm mới nhất tại cửa hàng của chúng tôi';
            case 'hot':
                return 'Những sản phẩm được khách hàng ưa chuộng nhất';
            default:
                return 'Khám phá tất cả sản phẩm tại Florista';
        }
    };

    renderPagination() {
        // Hàm render phân trang
        const { currentPage, productsPerPage, products } = this.state;
        const totalPages = Math.ceil(products.length / productsPerPage); // Tính tổng số trang
        
        if (totalPages <= 1) return null; // Nếu chỉ có một trang thì không cần phân trang
        
        const pageNumbers = []; // Mảng để lưu các số trang
        
        // Hiển thị tối đa 5 số trang với trang hiện tại ở giữa nếu có thể
        let startPage = Math.max(1, currentPage - 2); // Tính trang bắt đầu
        let endPage = Math.min(totalPages, startPage + 4); // Tính trang kết thúc
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4); // Điều chỉnh nếu số trang không đủ
        }
        
        // Luôn hiển thị trang đầu tiên
        if (startPage > 1) {
            pageNumbers.push(
                <li key={1} className="page-item">
                    <button 
                        className="page-link" 
                        onClick={() => this.handlePageChange(1)} // Khi nhấn vào, chuyển đến trang 1
                    >
                        1
                    </button>
                </li>
            );
            
            // Hiển thị dấu chấm lửng nếu trang đầu tiên không liền kề
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
                        onClick={() => this.handlePageChange(i)} // Khi nhấn vào, chuyển đến trang tương ứng
                    >
                        {i}
                    </button>
                </li>
            );
        }
        
        // Luôn hiển thị trang cuối cùng
        if (endPage < totalPages) {
            // Hiển thị dấu chấm lửng nếu trang cuối không liền kề
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
                        onClick={() => this.handlePageChange(totalPages)} // Khi nhấn vào, chuyển đến trang cuối
                    >
                        {totalPages}
                    </button>
                </li>
            );
        }
        
        return (
            <nav aria-label="Phân trang sản phẩm" className="pagination-container"> {/* Khung chứa phân trang */}
                <ul className="pagination"> {/* Danh sách các trang */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}> 
                        <button 
                            className="page-link" 
                            onClick={this.goToPrevPage} // Hàm chuyển đến trang trước
                            disabled={currentPage === 1} // Vô hiệu hóa nếu đang ở trang đầu
                        >
                            &laquo; {/* Dấu mũi tên trái */}
                        </button>
                    </li>
                    
                    {pageNumbers} {/* Hiển thị các số trang */}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={this.goToNextPage} // Hàm chuyển đến trang tiếp theo
                            disabled={currentPage === totalPages} // Vô hiệu hóa nếu đang ở trang cuối
                        >
                            &raquo; {/* Dấu mũi tên phải */}
                        </button>
                    </li>
                </ul>
            </nav>
        );
    }

    render() {
        const { filteredProducts, isLoading, error, title, currentPage, productsPerPage, categories, selectedCategory, price, sort, showMobileFilter } = this.state;
        const { token } = this.context;
        const isLoggedIn = !!token;

        if (isLoading) {
            return <LoadingSpinner />;
        }

        if (error) {
            return (
                <div className="error-container">
                    <FaInfoCircle className="error-icon" />
                    <p className="error-message">{error}</p>
                    <button 
                        className="retry-button"
                        onClick={() => this.fetchProducts()}
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        // Get current products for pagination
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

        return (
            <div className="all-products-container">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{this.getPageTitle()}</h2>
                        
                        <div className="section-divider">
                            <span className="divider-leaf"><FaLeaf /></span>
                        </div>
                        
                        <p className="section-subtitle">{this.getPageSubtitle()}</p>
                    </div>

                    <div className="products-content">
                        {/* Mobile Filter Toggle */}
                        <button 
                            className="mobile-filter-toggle"
                            onClick={this.toggleMobileFilter}
                        >
                            <FaFilter /> Bộ lọc sản phẩm <FaCaretDown />
                        </button>
                        
                        {/* Filters Sidebar */}
                        <div className={`products-sidebar ${showMobileFilter ? 'show-mobile-filter' : ''}`}>
                            <div className="sidebar-header">
                                <h3>Bộ lọc sản phẩm</h3>
                                <button 
                                    className="mobile-close-filter"
                                    onClick={this.toggleMobileFilter}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            <div className="filter-section">
                                <h4 className="filter-title">
                                    <FaFilter className="filter-icon" /> Danh mục
                                </h4>
                                <select 
                                    value={selectedCategory}
                                    onChange={this.handleCategoryChange}
                                    className="category-select"
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-section">
                                <h4 className="filter-title">
                                    <FaFilter className="filter-icon" /> Giá
                                </h4>
                                <form onSubmit={this.handlePriceFilter} className="price-filter-form">
                                    <div className="price-inputs">
                                        <input
                                            type="number"
                                            name="min"
                                            placeholder="Giá từ"
                                            value={price.min}
                                            onChange={this.handlePriceChange}
                                            className="price-input"
                                            min="0"
                                        />
                                        <span className="price-separator">-</span>
                                        <input
                                            type="number"
                                            name="max"
                                            placeholder="Giá đến"
                                            value={price.max}
                                            onChange={this.handlePriceChange}
                                            className="price-input"
                                            min={price.min || 0}
                                        />
                                    </div>
                                    <button type="submit" className="apply-price-btn">
                                        <FaSearch /> Áp dụng
                                    </button>
                                </form>
                            </div>
                            
                            <div className="filter-section">
                                <h4 className="filter-title">
                                    <FaSortAmountDown className="filter-icon" /> Sắp xếp
                                </h4>
                                <select 
                                    value={sort}
                                    onChange={this.handleSortChange}
                                    className="sort-select"
                                >
                                    <option value="dateDesc">Mới nhất</option>
                                    <option value="dateAsc">Cũ nhất</option>
                                    <option value="priceAsc">Giá tăng dần</option>
                                    <option value="priceDesc">Giá giảm dần</option>
                                    <option value="nameAsc">Tên A-Z</option>
                                    <option value="nameDesc">Tên Z-A</option>
                                </select>
                            </div>
                            
                            <button 
                                className="clear-filters-btn"
                                onClick={this.clearFilters}
                            >
                                <FaTimes /> Xóa bộ lọc
                            </button>
                        </div>
                        
                        {/* Products Grid */}
                        <div className="products-grid-container">
                            <div className="filter-status">
                                <p>
                                    Đang hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
                                    {selectedCategory && (
                                        <> trong danh mục <strong>
                                            {categories.find(c => c._id === selectedCategory)?.name || 'N/A'}
                                        </strong></>
                                    )}
                                    {(price.min || price.max) && (
                                        <> với giá{' '}
                                            {price.min && <strong>từ {Number(price.min).toLocaleString('vi-VN')}₫</strong>}
                                            {price.min && price.max && <> đến </>}
                                            {price.max && <strong>{Number(price.max).toLocaleString('vi-VN')}₫</strong>}
                                        </>
                                    )}
                                </p>
                            </div>
                            
                            {filteredProducts.length === 0 ? (
                                <div className="no-products-found">
                                    <FaInfoCircle className="no-products-icon" />
                                    <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc</p>
                                    <button 
                                        className="clear-filters-btn"
                                        onClick={this.clearFilters}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <ProductComponent
                                    products={currentProducts}
                                    emptyMessage="Không có sản phẩm nào để hiển thị."
                                    onAddToCart={this.handleAddToCart}
                                    onAddToWishlist={this.handleAddToWishlist}
                                    isLoggedIn={isLoggedIn}
                                    token={token}
                                />
                            )}
                        </div>
                    </div>

                    {this.renderPagination()}
                    
                    <div className="back-link">
                        <Link to="/" className="back-button">Quay lại trang chủ</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default AllProducts; // Xuất class AllProducts để sử dụng
