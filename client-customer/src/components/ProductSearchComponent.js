import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from '../utils/withRouter';
import axios from 'axios';
// import { FaEye, FaShoppingCart, FaHeart, FaLeaf, FaFolder, FaArrowRight } from 'react-icons/fa';
import { FaLeaf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import MyContext from '../contexts/MyContext';
import CartService from './services/CartService';
import ProductComponent from './ProductComponent';
import '../styles/ProductComponent.css'; // Thêm để có đồng nhất style với ProductComponent
import '../styles/ProductSearchComponent.css'; // CSS cho phân trang

// Lấy URL API từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com/api';

class ProductSearch extends Component {
    static contextType = MyContext;

    state = {
        products: [],
        isLoading: true,
        error: null,
        keyword: '',
        prevPathname: window.location.pathname,
        categories: {},
        currentPage: 1,
        productsPerPage: 10
    };

    componentDidMount() {
        this.fetchCategories();
        this.fetchSearchResults();
    }

    componentDidUpdate() {
        const currentPathname = window.location.pathname;
        if (currentPathname !== this.state.prevPathname) {
            this.setState({ prevPathname: currentPathname }, () => {
                this.fetchSearchResults();
            });
        }
    }

    fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/customer/categories`);
            const categoriesMap = {};
            response.data.forEach(category => {
                categoriesMap[category._id] = category.name;
            });
            this.setState({ categories: categoriesMap });
        } catch (error) {
            console.error('Lỗi khi lấy danh mục:', error);
            toast.error('Không thể tải danh mục sản phẩm');
        }
    };

    fetchSearchResults = async () => {
        const encodedKeyword = window.location.pathname.split('/').pop();
        const keyword = decodeURIComponent(encodedKeyword);

        this.setState({ isLoading: true, keyword });

        try {
            const response = await axios.get(`${API_URL}/customer/products/search/${keyword}`);
            this.setState({
                products: response.data || [],
                isLoading: false,
                currentPage: 1 // Reset về trang đầu tiên khi tìm kiếm mới
            });
        } catch (error) {
            this.setState({
                error: 'Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.',
                isLoading: false
            });
            toast.error('Lỗi khi tìm kiếm sản phẩm');
        }
    };

    handleAddToCart = async (product) => {
        try {
            const success = await CartService.addToCart(
                product,
                1,
                this.context.token
            );
            if (success) {
                CartService.showSuccessToast(product.name);
                if (this.props.onCartUpdate) {
                    this.props.onCartUpdate();
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
    };

    handleBuyNow = async (product) => {
        try {
            // Clear checkout from cart flag to avoid conflicts
            localStorage.removeItem('checkoutFromCart');
            
            // Clear any existing buyNow items
            localStorage.removeItem('buyNowItems');
            
            // Create a new array with only the product being bought now
            const buyNowItems = [{
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    category: product.category || null
                },
                quantity: 1
            }];
            
            // Save to localStorage
            localStorage.setItem('buyNowItems', JSON.stringify(buyNowItems));
            
            // Redirect to checkout page
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Buy now error:', error);
            toast.error('Có lỗi xảy ra khi xử lý đơn hàng');
        }
    };

    handleAddToWishlist = async (productId) => {
        const { token } = this.context;

        if (!token) {
            toast.info('Vui lòng đăng nhập để lưu sản phẩm yêu thích');
            localStorage.setItem('returnUrl', window.location.pathname);
            window.location.href = '/login';
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/customer/wishlist/add`,
                { productId },
                { headers: { 'x-access-token': token } }
            );

            if (res.data) {
                toast.success('Đã thêm vào danh sách yêu thích!');
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate();
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào yêu thích');
        }
    };

    handlePageChange = (pageNumber) => {
        this.setState({ currentPage: pageNumber });
        window.scrollTo(0, 0); // Cuộn lên đầu trang khi đổi trang
    };

    renderPagination() {
        const { currentPage, productsPerPage, products } = this.state;
        const totalPages = Math.ceil(products.length / productsPerPage);
        
        if (totalPages <= 1) return null;
        
        const pageNumbers = [];
        
        // Hiển thị tối đa 5 số trang với trang hiện tại ở giữa nếu có thể
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
                        onClick={() => this.handlePageChange(i)}
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
                        onClick={() => this.handlePageChange(totalPages)}
                    >
                        {totalPages}
                    </button>
                </li>
            );
        }
        
        return (
            <nav aria-label="Phân trang tìm kiếm sản phẩm" className="pagination-container">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => this.handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            &laquo;
                        </button>
                    </li>
                    
                    {pageNumbers}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => this.handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            &raquo;
                        </button>
                    </li>
                </ul>
            </nav>
        );
    }

    renderLoadingState() {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tìm kiếm sản phẩm...</p>
            </div>
        );
    }

    renderErrorState() {
        return (
            <div className="error-container">
                <div className="error-icon">!</div>
                <p>{this.state.error}</p>
                <div className="back-link">
                    <Link to="/products" className="back-button">Xem Tất Cả Sản Phẩm</Link>
                </div>
            </div>
        );
    }

    render() {
        const { products, isLoading, error, keyword, currentPage, productsPerPage } = this.state;
        const { token } = this.context || {};

        if (isLoading) return this.renderLoadingState();
        if (error) return this.renderErrorState();

        // Lấy sản phẩm cho trang hiện tại
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

        return (
            <div className="category-products-container">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Kết quả tìm kiếm: {keyword}</h2>
                        <div className="section-divider">
                            <span className="divider-leaf"><FaLeaf /></span>
                        </div>
                        <p className="section-subtitle">Tìm thấy {products.length} sản phẩm</p>
                    </div>

                    <ProductComponent
                        products={currentProducts}
                        onAddToCart={this.handleAddToCart}
                        onAddToWishlist={this.handleAddToWishlist}
                        token={token}
                        isLoggedIn={!!token}
                        emptyMessage="Không tìm thấy sản phẩm nào phù hợp với từ khóa tìm kiếm"
                        showViewAllButton={false}
                    />

                    {this.renderPagination()}

                    <div className="back-link">
                        <Link to="/products" className="back-button">Xem Tất Cả Sản Phẩm</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ProductSearch);