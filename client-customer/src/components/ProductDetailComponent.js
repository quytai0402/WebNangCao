import React, { Component } from 'react';
import { FaHeart, FaShieldAlt, FaShoppingCart, FaTruck, FaUndoAlt, FaShare } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import CartService from './services/CartService';
import CommentComponent from './CommentComponent';
import { Link } from 'react-router-dom';

import '../styles/ProductDetailComponent.css';

class ProductDetail extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            product: null,
            quantity: 1,
            imageError: false,
            isLoggedIn: false,
            selectedImage: null,
            loading: true,
            error: null,
            isInWishlist: false,
            processingWishlist: false
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        const { params } = this.props;
        this.checkLoginStatus();
        this.fetchProduct(params.id);
        this.fetchProductData();
        window.addEventListener('resize', this.checkDescriptionHeight);
    }

    componentDidUpdate(prevProps, prevState) {
        // If the product data has changed, check the description height
        if (prevState.product?.description !== this.state.product?.description) {
            this.checkDescriptionHeight();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.checkDescriptionHeight);
    }

    checkLoginStatus = () => {
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;
        this.setState({ isLoggedIn });
        
        if (isLoggedIn && this.state.product) {
            this.checkWishlistStatus(this.state.product._id);
        }
    }

    fetchProduct = async (id) => {
        this.setState({ loading: true, error: null, product: null });
        
        try {
            const res = await axios.get(`${this.context.apiUrl}/customer/products/${id}`);
            
            // Check if the response indicates a product not found or deleted
            if (!res.data || res.data.success === false) {
                this.setState({ 
                    error: res.data?.message || 'Sản phẩm không tồn tại hoặc đã bị xóa',
                    loading: false 
                });
                return;
            }
            
            this.setState({ 
                product: res.data,
                selectedImage: this.getImageUrl(res.data.image),
                loading: false
            });
            
            // Check wishlist status after fetching product
            if (this.state.isLoggedIn) {
                this.checkWishlistStatus(res.data._id);
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            
            // Kiểm tra lỗi với mã 404 - Sản phẩm không tồn tại
            if (error.response && error.response.status === 404) {
                this.setState({ 
                    error: 'Sản phẩm không tồn tại hoặc đã bị xóa',
                    loading: false 
                });
                
                // Xóa cache nếu đang lưu sản phẩm đã xóa
                this.clearProductFromCache(id);
            } else {
                this.setState({ 
                    error: 'Không thể tải thông tin sản phẩm',
                    loading: false 
                });
            }
        }
    }

    checkWishlistStatus = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await axios.get(`${this.context.apiUrl}/customer/wishlist/check/${productId}`, {
                headers: { 'x-access-token': token }
            });
            
            if (response.data.success) {
                this.setState({ isInWishlist: response.data.isInWishlist });
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
        }
    }

    fetchProductData = async () => {
        // If product not loaded yet, exit
        if (!this.state.product || !this.state.product._id) return;
        
        try {
            // Get product ID
            const productId = this.state.product._id;
            
            // Fetch related products, reviews, or other supplementary data
            const [relatedProductsRes, recommendedProductsRes] = await Promise.allSettled([
                axios.get(`${this.context.apiUrl}/customer/products/related/${productId}`),
                axios.get(`${this.context.apiUrl}/customer/products/recommended/${productId}`)
            ]);
            
            // Update state with additional data
            this.setState({
                relatedProducts: relatedProductsRes.status === 'fulfilled' ? relatedProductsRes.value.data : [],
                recommendedProducts: recommendedProductsRes.status === 'fulfilled' ? recommendedProductsRes.value.data : []
            });
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bổ sung của sản phẩm:', error);
            // Non-critical error, don't set error state
        }
    }

    handleQuantityChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value > 0 && value <= 99) {
            this.setState({ quantity: value });
        }
    }

    formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    }

    handleAddToCart = async (e) => {
        e.preventDefault();
        const { product, quantity } = this.state;
        
        try {
            const success = await CartService.addToCart(
                product,
                quantity,
                this.context.token,
                false
            );
            if (success) {
                // Show a notification manually after adding to cart
                CartService.showSuccessToast(product.name);
                if (this.props.onCartUpdate) {
                    this.props.onCartUpdate();
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
    }

    handleBuyNow = async (e) => {
        e.preventDefault();
        const { product, quantity } = this.state;

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
                    category: product.category || null // Handle case when category is undefined
                },
                quantity: quantity
            }];
            
            // Save to localStorage
            localStorage.setItem('buyNowItems', JSON.stringify(buyNowItems));
            
            // Redirect to checkout page
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Buy now error:', error);
            toast.error('Có lỗi xảy ra khi xử lý đơn hàng');
        }
    }

    handleWishlist = async () => {
        const { isLoggedIn, isInWishlist, product, processingWishlist } = this.state;
        
        if (!isLoggedIn) {
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích', {
                toastId: 'wishlist-login-required'
            });
            localStorage.setItem('returnUrl', window.location.pathname);
            window.location.href = '/login';
            return;
        }
        
        // Prevent duplicate requests
        if (processingWishlist) {
            return;
        }
        
        // Mark wishlist action as processing
        this.setState({ processingWishlist: true });
        
        try {
            const token = localStorage.getItem('token');
            const productId = product._id;
            const endpoint = isInWishlist 
                ? `${this.context.apiUrl}/customer/wishlist/remove` 
                : `${this.context.apiUrl}/customer/wishlist/add`;
            
            console.log(`Sending request to ${endpoint} for product ${productId}`);
            console.log('Token present:', !!token);
            
            const response = await axios.post(endpoint, 
                { productId },
                { headers: { 'x-access-token': token } }
            );
            
            console.log('Wishlist response:', response.data);
            
            if (response.data.success) {
                // Update the state
                this.setState({ 
                    isInWishlist: !isInWishlist,
                    processingWishlist: false 
                });
                
                // Show toast message with a unique ID to prevent duplicates
                if (isInWishlist) {
                    toast.success('Đã xóa khỏi danh sách yêu thích!', {
                        toastId: `remove-wishlist-${productId}`,
                        autoClose: 2000
                    });
                } else {
                    toast.success('Đã thêm vào danh sách yêu thích!', {
                        toastId: `add-wishlist-${productId}`,
                        autoClose: 2000
                    });
                }
                
                // Update wishlist count in UI
                if (this.props.onWishlistUpdate) {
                    this.props.onWishlistUpdate();
                }
                
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('wishlistUpdated'));
            } else {
                console.error('Wishlist operation failed:', response.data.message);
                toast.error(response.data.message || 'Có lỗi xảy ra khi cập nhật danh sách yêu thích', {
                    toastId: `wishlist-error-${Date.now()}`
                });
                this.setState({ processingWishlist: false });
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
            
            const action = isInWishlist ? 'xóa khỏi' : 'thêm vào';
            toast.error(`Có lỗi xảy ra khi ${action} yêu thích`, {
                toastId: `wishlist-error-${Date.now()}`
            });
            this.setState({ processingWishlist: false });
        }
    }

    handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: this.state.product.name,
                text: this.state.product.description,
                url: window.location.href,
            })
            .catch((error) => console.log('Error sharing', error));
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => toast.success('Đã sao chép link sản phẩm!'))
                .catch(() => toast.error('Không thể sao chép link'));
        }
    }

    getImageUrl = (image) => {
        if (!image) return '/images/default-product.png';
        
        if (image.startsWith('http')) return image;
        if (image.startsWith('data:image')) return image;
        
        return `data:image/jpeg;base64,${image}`;
    }

    renderLoading() {
        return (
            <div className="loading-container">
                <div className="loading-animation">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">
                        <h3>Đang tải sản phẩm</h3>
                        <p>Vui lòng đợi giây lát...</p>
                    </div>
                </div>
            </div>
        );
    }

    renderError() {
        const isDeleted = this.state.error?.response?.data === 'Sản phẩm đã bị xóa';
        const errorTitle = isDeleted ? "Sản phẩm đã bị xóa" : "Sản phẩm không tồn tại";
        const errorMessage = isDeleted 
            ? "Sản phẩm này đã bị gỡ khỏi cửa hàng và không còn khả dụng." 
            : "Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đường dẫn không chính xác.";

        return (
            <div className="product-not-found-container">
                <div className="not-found-content">
                    <div className="not-found-icon">
                        <i className="fas fa-exclamation-circle" style={{ color: '#e75480' }}></i>
                    </div>
                    <h2 className="not-found-title">{errorTitle}</h2>
                    <p className="not-found-message">{errorMessage}</p>
                    
                    <div className="not-found-info">
                        <p>Bạn có thể kiểm tra lại URL hoặc quay trở lại trang trước đó.</p>
                        <p>Bạn cũng có thể khám phá các sản phẩm khác tại cửa hàng của chúng tôi.</p>
                    </div>
                    
                    <div className="not-found-actions">
                        <button 
                            className="back-button"
                            onClick={() => window.history.back()}
                        >
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            Quay lại
                        </button>
                        <Link 
                            to="/product" 
                            className="products-button"
                        >
                            <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
                            Xem sản phẩm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { 
            product, 
            quantity, 
            imageError, 
            isLoggedIn, 
            selectedImage,
            loading,
            error,
            isInWishlist
        } = this.state;

        if (loading) return this.renderLoading();
        if (error) return this.renderError();
        if (!product) return null;

        return (
            <div className="product-detail-container">
                <div className="product-detail-wrapper">
                    <div className="product-detail-grid">
                        <div className="pd-product-gallery">
                            <div className="pd-main-image">
                                <img 
                                    src={selectedImage || this.getImageUrl(product.image)}
                                    alt={product.name}
                                    onError={(e) => {
                                        if (!imageError) {
                                            this.setState({ imageError: true });
                                            e.target.src = '/images/default-product.png';
                                        }
                                    }}
                                    loading="lazy"
                                />
                            </div>
                            {product.image2 && (
                                <div className="pd-thumbnail-images">
                                    <img
                                        src={this.getImageUrl(product.image)}
                                        alt={`${product.name} - 1`}
                                        onClick={() => this.setState({ 
                                            selectedImage: this.getImageUrl(product.image) 
                                        })}
                                        className={selectedImage === this.getImageUrl(product.image) ? 'active' : ''}
                                    />
                                    <img
                                        src={this.getImageUrl(product.image2)}
                                        alt={`${product.name} - 2`}
                                        onClick={() => this.setState({ 
                                            selectedImage: this.getImageUrl(product.image2) 
                                        })}
                                        className={selectedImage === this.getImageUrl(product.image2) ? 'active' : ''}
                                    />
                                </div>
                            )}
                            <div className="pd-share-buttons">
                                <button 
                                    className={`pd-wishlist-btn ${!isLoggedIn ? 'not-logged-in' : ''} ${isInWishlist ? 'in-wishlist' : ''}`}
                                    onClick={this.handleWishlist}
                                >
                                    <FaHeart className={isInWishlist ? 'active' : ''} /> 
                                    <span>{isLoggedIn 
                                        ? (isInWishlist ? 'Đã yêu thích' : 'Thêm vào yêu thích') 
                                        : 'Đăng nhập để yêu thích'}</span>
                                </button>
                                <button className="pd-share-btn" onClick={this.handleShare}>
                                    <FaShare /> <span>Chia sẻ</span>
                                </button>
                            </div>
                        </div>
    
                        <div className="pd-product-info">
                            <div className="pd-product-breadcrumb">
                                Trang chủ <span>›</span> {product.category?.name || 'Sản phẩm'}
                            </div>
                            <h1 className="pd-product-title">{product.name}</h1>
                            
                            <div className="pd-product-price-container">
                                <div className="pd-product-price">
                                    {this.formatPrice(product.price)}
                                </div>
                                {product.oldPrice && product.oldPrice > product.price && (
                                    <div className="pd-product-old-price">
                                        {this.formatPrice(product.oldPrice)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="pd-product-description">
                                <h3>Mô tả sản phẩm</h3>
                                {product.description ? (
                                    <>
                                        <div 
                                            className="product-description-content"
                                            dangerouslySetInnerHTML={{ __html: this.formatDescription(product.description) }} 
                                        />
                                        <button 
                                            className="pd-description-expand-btn"
                                            onClick={this.toggleDescriptionExpand}
                                        >
                                            Xem thêm
                                        </button>
                                    </>
                                ) : (
                                    <div className="product-description-placeholder">
                                        <p>Hiện chưa có mô tả chi tiết cho sản phẩm này.</p>
                                        <p>Vui lòng liên hệ với chúng tôi để biết thêm thông tin.</p>
                                    </div>
                                )}
                            </div>
    
                            <form className="pd-add-to-cart-form" onSubmit={this.handleAddToCart}>
                                <div className="pd-quantity-control">
                                    <label htmlFor="quantity">Số lượng:</label>
                                    <button 
                                        type="button" 
                                        onClick={() => this.setState(prev => ({ 
                                            quantity: Math.max(1, prev.quantity - 1) 
                                        }))}
                                    >
                                        -
                                    </button>
                                    <input 
                                        id="quantity"
                                        type="number" 
                                        min="1" 
                                        max="99" 
                                        value={quantity}
                                        onChange={this.handleQuantityChange}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => this.setState(prev => ({ 
                                            quantity: Math.min(99, prev.quantity + 1) 
                                        }))}
                                    >
                                        +
                                    </button>
                                </div>
                                
                                <div className="pd-action-buttons">
                                    <button 
                                        type="submit" 
                                        className="pd-add-to-cart-btn"
                                        disabled={!product.price || quantity < 1}
                                    >
                                        <FaShoppingCart /> Thêm vào giỏ hàng
                                    </button>
                                    <button 
                                        type="button" 
                                        className="pd-buy-now-btn"
                                        onClick={this.handleBuyNow}
                                        disabled={!product.price || quantity < 1}
                                    >
                                        Mua ngay
                                    </button>
                                </div>
                            </form>
    
                            <div className="pd-product-benefits">
                                <div className="pd-benefit-item">
                                    <FaTruck />
                                    <span>Giao hàng miễn phí</span>
                                </div>
                                <div className="pd-benefit-item">
                                    <FaShieldAlt />
                                    <span>Bảo hành 12 tháng</span>
                                </div>
                                <div className="pd-benefit-item">
                                    <FaUndoAlt />
                                    <span>Đổi trả trong 7 ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <CommentComponent productId={product._id} />
            </div>
        );
    }

    // Phương thức xóa sản phẩm không còn tồn tại từ cache
    clearProductFromCache = (productId) => {
        try {
            // Xóa sản phẩm khỏi các danh sách sản phẩm đã cache
            ['newProds', 'hotProds'].forEach(cacheKey => {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        const products = JSON.parse(cachedData);
                        const updatedProducts = products.filter(p => p && p._id !== productId);
                        sessionStorage.setItem(cacheKey, JSON.stringify(updatedProducts));
                    } catch (error) {
                        console.error(`Lỗi khi cập nhật cache ${cacheKey}:`, error);
                    }
                }
            });
            
            console.log(`Đã xóa sản phẩm ${productId} khỏi cache`);
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi cache:', error);
        }
    }

    // Add this method to format description text
    formatDescription = (description) => {
        if (!description) return '';
        
        // Remove extra line breaks and whitespace
        let formattedText = description.trim();
        
        // Check if the text appears to already have HTML formatting
        const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(formattedText);
        
        // If it already has HTML formatting, return it without additional processing
        if (hasHtmlTags) {
            return formattedText;
        }
        
        // For plain text, apply formatting
        // First remove any existing paragraph tags that might cause duplication
        formattedText = formattedText.replace(/<\/?p>/g, '');
        
        // Convert line breaks to appropriate HTML
        formattedText = formattedText
            .replace(/\n{3,}/g, '</p><p>') // 3+ line breaks to new paragraph
            .replace(/\n\n/g, '</p><p>') // 2 line breaks to new paragraph
            .replace(/\n/g, '<br>'); // single line break to <br>
        
        // Wrap in paragraphs
        formattedText = '<p class="description-paragraph">' + formattedText + '</p>';
        
        // Format bullet points (lines starting with - or *)
        formattedText = formattedText.replace(/<p[^>]*>(\s*[-*].*?)<\/p>/g, (match, list) => {
            // Split by line breaks to get individual list items
            const items = list.split('<br>');
            let listHtml = '<ul class="description-list">';
            
            items.forEach(item => {
                // Remove - or * prefix and trim
                const cleanItem = item.replace(/^\s*[-*]\s*/, '').trim();
                if (cleanItem) {
                    listHtml += `<li>${cleanItem}</li>`;
                }
            });
            
            listHtml += '</ul>';
            return listHtml;
        });
        
        return formattedText;
    }

    // Check if description needs scroll functionality
    checkDescriptionHeight = () => {
        const descElem = document.querySelector('.product-description-content');
        if (!descElem) return;
        
        // Reset classes first
        descElem.classList.remove('scrollable', 'expanded');
        const expandBtn = document.querySelector('.pd-description-expand-btn');
        if (expandBtn) {
            expandBtn.classList.remove('visible');
            expandBtn.textContent = 'Xem thêm';
        }
        
        // Check if content is taller than container
        if (descElem.scrollHeight > 350) {
            descElem.classList.add('scrollable');
            if (expandBtn) {
                expandBtn.classList.add('visible');
            }
        }
    }

    // Toggle expanded view of description
    toggleDescriptionExpand = () => {
        const descElem = document.querySelector('.product-description-content');
        const expandBtn = document.querySelector('.pd-description-expand-btn');
        
        if (!descElem || !expandBtn) return;
        
        if (descElem.classList.contains('expanded')) {
            descElem.classList.remove('expanded');
            expandBtn.textContent = 'Xem thêm';
            // Scroll back to top of description
            descElem.scrollTop = 0;
        } else {
            descElem.classList.add('expanded');
            expandBtn.textContent = 'Thu gọn';
        }
    }
}

export default withRouter(ProductDetail);