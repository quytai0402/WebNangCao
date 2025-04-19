import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaShoppingBag, FaHeart, FaEye, FaFolder, FaStar, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CartService from './services/CartService';
import axios from 'axios';
import '../styles/ProductComponent.css';

class ProductComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            wishlistStatus: {}, // Object to track wishlist status for products
            processingWishlist: {} // Object to track processing status for wishlist operations
        };
    }

    componentDidMount() {
        this.checkWishlistStatus();
        window.addEventListener('wishlistUpdated', this.checkWishlistStatus);
    }

    componentWillUnmount() {
        window.removeEventListener('wishlistUpdated', this.checkWishlistStatus);
    }

    componentDidUpdate(prevProps) {
        // Check if products have changed
        if (prevProps.products !== this.props.products) {
            this.checkWishlistStatus();
        }
    }

    checkWishlistStatus = async () => {
        const { products, isLoggedIn, token } = this.props;
        
        if (!isLoggedIn || !token || !products || products.length === 0) {
            return;
        }
        
        try {
            const newWishlistStatus = { ...this.state.wishlistStatus };
            
            // Check each product individually to avoid race conditions
            for (const product of products) {
                try {
                    const response = await axios.get(`${this.context.apiUrl}/customer/wishlist/check/${product._id}`, {
                        headers: { 'x-access-token': token }
                    });
                    
                    if (response.data.success) {
                        newWishlistStatus[product._id] = response.data.isInWishlist;
                    }
                } catch (error) {
                    console.error(`Error checking wishlist status for product ${product._id}:`, error);
                }
            }
            
            this.setState({ wishlistStatus: newWishlistStatus });
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    }

    formatCurrency(price) {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND', 
            minimumFractionDigits: 0 
        }).format(price);
    }

    renderProductImage(product) {
        if (product.image) {
            if (product.image.startsWith('http') || product.image.startsWith('data:')) {
                return product.image;
            }
            return `data:image/jpeg;base64,${product.image}`;
        }
        return "/images/default-product.png";
    }

    handleAddToCart = async (product) => {
        try {
            const success = await CartService.addToCart(
                product, 
                1, 
                this.props.token,
                false
            );
            if (success) {
                // Show notification manually
                CartService.showSuccessToast(product.name);
                if (this.props.onCartUpdate) {
                    this.props.onCartUpdate();
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
    }

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
            toast.error('Có lỗi xảy ra khi mua ngay sản phẩm');
        }
    };

    handleWishlistClick = async (productId) => {
        const { isLoggedIn, token } = this.props;
        
        if (!isLoggedIn) {
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
            localStorage.setItem('returnUrl', window.location.pathname);
            window.location.href = '/login';
            return;
        }
        
        // Check if we're already processing a wishlist request for this product
        if (this.state.processingWishlist && this.state.processingWishlist[productId]) {
            return; // Prevent duplicate requests
        }
        
        // Mark this product as being processed
        this.setState(prevState => ({
            processingWishlist: {
                ...prevState.processingWishlist,
                [productId]: true
            }
        }));
        
        try {
            const isInWishlist = this.state.wishlistStatus[productId];
            const endpoint = isInWishlist ? '/api/customer/wishlist/remove' : '/api/customer/wishlist/add';
            
            console.log(`Sending request to ${endpoint} for product ${productId}`);
            console.log('Request data:', { productId });
            console.log('Token present:', !!token);
            
            const response = await axios.post(endpoint, 
                { productId },
                { headers: { 'x-access-token': token } }
            );
            
            console.log('Wishlist response:', response.data);
            
            if (response.data.success) {
                // Update local state
                this.setState(prevState => ({
                    wishlistStatus: {
                        ...prevState.wishlistStatus,
                        [productId]: !isInWishlist
                    },
                    processingWishlist: {
                        ...prevState.processingWishlist,
                        [productId]: false
                    }
                }));
                
                // Show toast message only if the specific toast doesn't already exist
                if (isInWishlist) {
                    toast.success('Đã xóa khỏi danh sách yêu thích!', {
                        toastId: 'remove-wishlist',
                        autoClose: 2000
                    });
                } else {
                    toast.success('Đã thêm vào danh sách yêu thích!', {
                        toastId: 'add-wishlist',
                        autoClose: 2000
                    });
                }
                
                // Call parent callback
                if (this.props.onAddToWishlist) {
                    this.props.onAddToWishlist(productId);
                }
                
                // Update global state
                window.dispatchEvent(new CustomEvent('wishlistUpdated'));
            } else {
                console.error('Wishlist operation failed:', response.data.message);
                toast.error(response.data.message || 'Có lỗi xảy ra khi cập nhật danh sách yêu thích');
                
                // Reset processing state
                this.setState(prevState => ({
                    processingWishlist: {
                        ...prevState.processingWishlist,
                        [productId]: false
                    }
                }));
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Request was made but no response was received:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
            
            // Fix: Access isInWishlist from state
            const isProductInWishlist = this.state.wishlistStatus[productId];
            const action = isProductInWishlist ? 'xóa khỏi' : 'thêm vào';
            toast.error(`Có lỗi xảy ra khi ${action} yêu thích`);
            
            // Reset processing state
            this.setState(prevState => ({
                processingWishlist: {
                    ...prevState.processingWishlist,
                    [productId]: false
                }
            }));
        }
    }

    renderCategoryBadge(product) {
        if (product && product.category) {
            return (
                <Link to={`/product/category/${product.category._id}`} className="category-badge">
                    <FaFolder /> {product.category.name}
                </Link>
            );
        }
        return null;
    }

    isNewProduct(product) {
        if (!product.createdAt) return false;
        const createdDate = new Date(product.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }

    renderDiscountBadge(product) {
        if (product.oldPrice && product.oldPrice > product.price) {
            const discountPercent = Math.round((1 - product.price / product.oldPrice) * 100);
            return (
                <span className="discount-badge">
                    -{discountPercent}%
                </span>
            );
        }
        return null;
    }

    renderEmptyState() {
        const { emptyMessage } = this.props;
        return (
            <div className="empty-products">
                <div className="empty-products-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="60" height="60">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <p>{emptyMessage || "Không có sản phẩm nào trong danh mục này"}</p>
                <Link to="/products?type=all=true?" className="browse-more-btn">Xem các sản phẩm khác</Link>
            </div>
        );
    }

    renderProductCard(product, rowIndex, index) {
        if (!product || !product._id) {
            return <div key={`empty-${rowIndex}-${index}`} className="product-card empty"></div>;
        }

        try {
            const { productsPerRow } = this.props;
            const isInWishlist = this.state.wishlistStatus[product._id];

            return (
                <div key={product._id} className={`product-card ${productsPerRow <= 3 ? 'product-card-large' : ''}`}>
                    <div className="product-image-container">
                        {this.renderCategoryBadge(product)}
                        {this.renderDiscountBadge(product)}
                        
                        <Link to={`/product/${product._id}`} className="product-image-link">
                            <img
                                src={this.renderProductImage(product)}
                                className="product-image"
                                alt={product.name}
                                loading="lazy"
                                onError={(e) => {
                                    e.target.src = "/images/default-product.png";
                                    e.target.onerror = null;
                                }}
                            />
                            {product.image2 && (
                                <img
                                    src={product.image2.startsWith('http') || product.image2.startsWith('data:')
                                        ? product.image2
                                        : `data:image/jpeg;base64,${product.image2}`}
                                    className="product-image-hover"
                                    alt={`${product.name} - Hình khác`}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.src = "/images/default-product.png";
                                        e.target.onerror = null;
                                    }}
                                />
                            )}
                        </Link>
                        
                        <div className="product-actions">
                            <Link to={`/product/${product._id}`} className="action-btn view-btn" title="Xem chi tiết">
                                <FaEye />
                            </Link>
                            
                            <button
                                className="action-btn cart-btn"
                                title="Thêm vào giỏ hàng"
                                onClick={() => this.handleAddToCart(product)}
                            >
                                <FaShoppingCart />
                            </button>

                            <button
                                className={`action-btn wishlist-btn ${!this.props.isLoggedIn ? 'not-logged-in' : ''} ${isInWishlist ? 'in-wishlist' : ''}`}
                                title={!this.props.isLoggedIn 
                                    ? "Đăng nhập để thêm vào yêu thích" 
                                    : (isInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích")}
                                onClick={() => this.handleWishlistClick(product._id)}
                            >
                                <FaHeart className={isInWishlist ? 'active' : ''} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="product-info">
                        <div className="product-rating">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FaStar 
                                    key={i} 
                                    className={i < (product.rating || 5) ? "star filled" : "star"}
                                    style={{ "--i": i }}
                                />
                            ))}
                            {product.reviewCount && (
                                <span className="review-count">({product.reviewCount})</span>
                            )}
                        </div>
                        
                        <h3 className="product-name">
                            <Link to={`/product/${product._id}`}>{product.name}</Link>
                        </h3>
                        
                        <div className="product-price-container">
                            <div className="product-price">{this.formatCurrency(product.price)}</div>
                            {product.oldPrice && product.oldPrice > product.price && (
                                <div className="product-old-price">{this.formatCurrency(product.oldPrice)}</div>
                            )}
                        </div>
                        
                        <button 
                            className="buy-now-btn" 
                            onClick={() => this.handleBuyNow(product)}
                        >
                            <FaShoppingBag className="btn-icon" /> Mua Ngay
                        </button>
                    </div>
                </div>
            );
        } catch (error) {
            console.error('Error rendering product card:', error, product);
            return <div key={`error-${rowIndex}-${index}`} className="product-card empty"></div>;
        }
    }

    render() {
        const { products, category, title, sectionType, viewAllUrl: propViewAllUrl, viewAllLabel, showViewAllButton: propShowViewAll } = this.props;
    
        // Lọc sản phẩm không hợp lệ trước khi hiển thị
        const validProducts = Array.isArray(products) 
            ? products.filter(product => product && product._id)
            : [];
            
        if (!validProducts || validProducts.length === 0) {
            return this.renderEmptyState();
        }
    
        // Kiểm tra xem URL hiện tại có chứa all=true không
        const isAllProductsView = window.location.search.includes('all=true');
        
        let productsPerRow = 5;
        if (validProducts.length <= 2) {
            productsPerRow = 2;
        } else if (validProducts.length <= 4) {
            productsPerRow = validProducts.length;
        }
        
        // Chỉ giới hạn sản phẩm nếu KHÔNG phải là chế độ xem tất cả
        const displayProducts = isAllProductsView ? 
            validProducts : 
            validProducts.slice(0, 10);
        
        const rows = [];
        for (let i = 0; i < displayProducts.length; i += productsPerRow) {
            rows.push(displayProducts.slice(i, i + productsPerRow));
        }
    
        // Chỉ thêm phần tử trống vào hàng cuối nếu không phải chế độ xem tất cả
        if (!isAllProductsView) {
            const lastRow = rows[rows.length - 1];
            if (productsPerRow === 5 && lastRow && lastRow.length < productsPerRow) {
                const emptyItemsCount = productsPerRow - lastRow.length;
                for (let i = 0; i < emptyItemsCount; i++) {
                    lastRow.push(null);
                }
            }
        }
    
        // Xác định URL và hiển thị nút "Xem tất cả"
        let viewAllUrl = propViewAllUrl || '/products?all=true';
        
        // Thay đổi logic hiển thị nút "Xem tất cả"
        // Chỉ hiển thị khi có trên 10 sản phẩm và không ở chế độ xem tất cả
        let showViewAllButton = validProducts.length > 10;
        
        if (!isAllProductsView && validProducts.length > 10) {
            if (category) {
                viewAllUrl = `/product/category/${category._id}?all=true`;
            } else if (sectionType === 'new') {
                viewAllUrl = '/products?type=new&all=true';
            } else if (sectionType === 'hot') {
                viewAllUrl = '/products?type=hot&all=true';
            }
            
            showViewAllButton = true;
        }
        
        // Nếu prop showViewAllButton được đặt rõ ràng thành false, thì ưu tiên giá trị đó
        if (propShowViewAll === false) {
            showViewAllButton = false;
        }
    
        // Get the appropriate view all label
        let buttonLabel = viewAllLabel || "Xem Tất Cả Sản Phẩm";
        if (category) {
            buttonLabel = `Xem Tất Cả Sản Phẩm ${category.name}`;
        } else if (sectionType === 'new') {
            buttonLabel = "Xem Tất Cả Sản Phẩm Mới";
        } else if (sectionType === 'hot') {
            buttonLabel = "Xem Tất Cả Sản Phẩm Bán Chạy";
        }
    
    
        return (
            <div className="products-section">
                {title && (
                    <div className="section-header">
                        <h2 className="section-title">{title}</h2>
                        {showViewAllButton && (
                            <Link to={viewAllUrl} className="section-view-all">
                                Xem tất cả <FaArrowRight />
                            </Link>
                        )}
                    </div>
                )}
                    
                <div className={`products-container products-count-${productsPerRow}`}>
                    {rows.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className={`products-row row-items-${row.length}`}>
                            {row.map((product, index) => this.renderProductCard(product, rowIndex, index))}
                        </div>
                    ))}
                </div>
                
                {showViewAllButton && (
                    <div className="view-all-container">
                        <Link to={viewAllUrl} className="view-all-button">
                            <span>{buttonLabel}</span>
                            <FaArrowRight className="view-all-icon" />
                        </Link>
                    </div>
                )}
            </div>
        );
    }
}

export default ProductComponent;