import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import MyContext from '../contexts/MyContext';
import withRouter from '../utlis/withRouter';
import '../styles/WishlistComponent.css';
import { FaHeart, FaShoppingCart, FaTrash } from 'react-icons/fa';
import CartService from './services/CartService';

class WishlistComponent extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            wishlist: [],
            loading: true,
            error: null,
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.fetchWishlist();
        window.addEventListener('wishlistUpdated', this.fetchWishlist);
    }

    componentWillUnmount() {
        window.removeEventListener('wishlistUpdated', this.fetchWishlist);
    }

    fetchWishlist = async (page = 1) => {
        try {
            this.setState({ loading: true });
            const token = localStorage.getItem('token');
            
            if (!token) {
                this.props.router.navigate('/login');
                return;
            }

            const response = await axios.get(`/api/customer/wishlist?page=${page}&limit=10`, {
                headers: { 'x-access-token': token }
            });

            if (response.data.success) {
                // Kiểm tra và làm sạch các sản phẩm không hợp lệ
                const cleanedWishlist = await this.cleanupInvalidWishlistItems(response.data.items);
                
                this.setState({
                    wishlist: cleanedWishlist,
                    pagination: response.data.pagination,
                    loading: false
                });
                
                // Update wishlist count in header
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate();
                }
            } else {
                this.setState({
                    error: response.data.message || 'Không thể tải danh sách yêu thích',
                    loading: false
                });
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            this.setState({
                error: 'Đã xảy ra lỗi khi tải danh sách yêu thích',
                loading: false
            });
            
            if (error.response && error.response.status === 401) {
                toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                this.props.router.navigate('/login');
            }
        }
    };

    handleRemoveFromWishlist = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post('/api/customer/wishlist/remove', 
                { productId },
                { headers: { 'x-access-token': token } }
            );

            if (response.data.success) {
                // Update wishlist state by removing the item
                this.setState(prevState => ({
                    wishlist: prevState.wishlist.filter(item => item.product._id !== productId)
                }));
                
                toast.success('Đã xóa khỏi danh sách yêu thích', {
                    toastId: `remove-wishlist-${productId}`
                });
                
                // Update wishlist count in header
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate();
                }
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('wishlistUpdated'));
            } else {
                toast.error(response.data.message || 'Không thể xóa khỏi danh sách yêu thích', {
                    toastId: `wishlist-error-${Date.now()}`
                });
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Đã xảy ra lỗi khi xóa khỏi danh sách yêu thích', {
                toastId: `wishlist-error-${Date.now()}`
            });
        }
    };

    handleClearWishlist = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post('/api/customer/wishlist/clear', 
                {},
                { headers: { 'x-access-token': token } }
            );

            if (response.data.success) {
                this.setState({ wishlist: [] });
                toast.success('Đã xóa toàn bộ danh sách yêu thích', {
                    toastId: 'clear-wishlist'
                });
                
                // Update wishlist count in header
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate();
                }
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('wishlistUpdated'));
            } else {
                toast.error(response.data.message || 'Không thể xóa danh sách yêu thích', {
                    toastId: `clear-wishlist-error-${Date.now()}`
                });
            }
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            toast.error('Đã xảy ra lỗi khi xóa danh sách yêu thích', {
                toastId: `clear-wishlist-error-${Date.now()}`
            });
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
                
                // Update cart count in header
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
    };

    formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    };

    getImageUrl = (image) => {
        if (!image) return '/images/default-product.png';
        
        if (image.startsWith('http')) return image;
        if (image.startsWith('data:image')) return image;
        
        return `data:image/jpeg;base64,${image}`;
    };

    handlePageChange = (page) => {
        this.fetchWishlist(page);
    };

    renderPagination() {
        const { page, totalPages } = this.state.pagination;
        
        if (totalPages <= 1) return null;
        
        const pages = [];
        const maxPagesToShow = 5;
        
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`pagination-btn ${page === i ? 'active' : ''}`}
                    onClick={() => this.handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }
        
        return (
            <div className="wishlist-pagination">
                <button
                    className="pagination-btn prev"
                    disabled={page === 1}
                    onClick={() => this.handlePageChange(page - 1)}
                >
                    &laquo;
                </button>
                
                {startPage > 1 && (
                    <>
                        <button
                            className="pagination-btn"
                            onClick={() => this.handlePageChange(1)}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}
                
                {pages}
                
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                            className="pagination-btn"
                            onClick={() => this.handlePageChange(totalPages)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                
                <button
                    className="pagination-btn next"
                    disabled={page === totalPages}
                    onClick={() => this.handlePageChange(page + 1)}
                >
                    &raquo;
                </button>
            </div>
        );
    }

    renderEmptyWishlist() {
        return (
            <div className="empty-wishlist">
                <div className="empty-wishlist-icon">
                    <FaHeart />
                </div>
                <h2>Danh sách yêu thích trống</h2>
                <p>Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
                <Link to="/products" className="continue-shopping-btn">
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    renderWishlistItems() {
        const { wishlist } = this.state;
        
        return (
            <div className="wishlist-items">
                {wishlist.map(item => {
                    if (!item.product || !item.product._id) {
                        return null;
                    }
                    
                    return (
                        <div className="wishlist-item" key={item._id}>
                            <div className="wishlist-item-image">
                                <Link to={`/product/${item.product._id}`}>
                                    <img 
                                        src={this.getImageUrl(item.product.image)} 
                                        alt={item.product.name}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/default-product.png';
                                        }}
                                    />
                                </Link>
                            </div>
                            
                            <div className="wishlist-item-details">
                                <Link to={`/product/${item.product._id}`} className="wishlist-item-name">
                                    {item.product.name}
                                </Link>
                                
                                <div className="wishlist-item-category">
                                    Danh mục: {item.product.category?.name || 'Không có danh mục'}
                                </div>
                                
                                <div className="wishlist-item-price">
                                    {this.formatPrice(item.product.price)}
                                </div>
                            </div>
                            
                            <div className="wishlist-item-actions">
                                <button 
                                    className="add-to-cart-btn"
                                    onClick={() => this.handleAddToCart(item.product)}
                                >
                                    <FaShoppingCart /> Thêm vào giỏ hàng
                                </button>
                                
                                <button 
                                    className="remove-btn"
                                    onClick={() => this.handleRemoveFromWishlist(item.product._id)}
                                >
                                    <FaTrash /> Xóa
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Phương thức để lọc và xóa các sản phẩm không hợp lệ khỏi wishlist
    cleanupInvalidWishlistItems = async (wishlistItems) => {
        if (!wishlistItems || wishlistItems.length === 0) return wishlistItems;
        
        const invalidItems = wishlistItems.filter(item => !item.product || !item.product._id);
        
        if (invalidItems.length > 0) {
            const token = localStorage.getItem('token');
            if (!token) return wishlistItems;
            
            console.log(`Đang xóa ${invalidItems.length} sản phẩm không hợp lệ khỏi wishlist`);
            
            // Xóa các item không hợp lệ khỏi backend
            for (const item of invalidItems) {
                try {
                    if (item._id) {
                        await axios.post('/api/customer/wishlist/removeById', 
                            { wishlistItemId: item._id },
                            { headers: { 'x-access-token': token } }
                        );
                    }
                } catch (error) {
                    console.error('Lỗi khi xóa sản phẩm không hợp lệ:', error);
                }
            }
            
            // Chỉ giữ lại các item hợp lệ
            return wishlistItems.filter(item => item.product && item.product._id);
        }
        
        return wishlistItems;
    }

    render() {
        const { wishlist, loading, error } = this.state;
        
        if (loading) {
            return (
                <div className="wishlist-container">
                    <div className="wishlist-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải danh sách yêu thích...</p>
                    </div>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="wishlist-container">
                    <div className="wishlist-error">
                        <h2>Đã xảy ra lỗi</h2>
                        <p>{error}</p>
                        <button onClick={() => this.fetchWishlist()} className="retry-btn">
                            Thử lại
                        </button>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="wishlist-container">
                <div className="wishlist-header">
                    <h1>Danh sách yêu thích</h1>
                    {wishlist.length > 0 && (
                        <button 
                            className="clear-wishlist-btn"
                            onClick={this.handleClearWishlist}
                        >
                            <FaTrash /> Xóa tất cả
                        </button>
                    )}
                </div>
                
                {wishlist.length === 0 ? (
                    this.renderEmptyWishlist()
                ) : (
                    <>
                        {this.renderWishlistItems()}
                        {this.renderPagination()}
                    </>
                )}
            </div>
        );
    }
}

export default withRouter(WishlistComponent); 