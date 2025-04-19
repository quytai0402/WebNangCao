import axios from 'axios';
import React, { Component, useEffect, useState, memo, lazy, Suspense } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { FaArrowRight, FaShoppingCart, FaTimes, FaHeart, FaLeaf } from 'react-icons/fa';
import { toast } from 'react-toastify';
import MyContext from '../contexts/MyContext';
import { motion } from 'framer-motion';

import '../styles/HomeComponent.css';
import '../styles/ProductSearchComponent.css'; // Import CSS phân trang

// Lazy load ProductComponent for better initial load time
const ProductComponent = lazy(() => import('./ProductComponent'));

// Optimized loading component
const LoadingSpinner = memo(() => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Đang tải sản phẩm...</p>
  </div>
));

// Memoized error component
const ErrorDisplay = memo(({ error, retry }) => (
  <div className="error-container">
    <div className="error-icon">!</div>
    <p>Có lỗi xảy ra: {error}</p>
    <button className="retry-button" onClick={retry}>Thử lại</button>
  </div>
));

// Memoized Hero component for better performance
const HeroSection = memo(({ heroImages, currentHeroIndex, setHeroSlide }) => {
  const currentHero = heroImages[currentHeroIndex];
  
  return (
    <section 
      className="hero-section" 
      style={{ 
        backgroundImage: `url(${currentHero.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="hero-overlay"></div>
      <div className="container">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {currentHero.title}
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {currentHero.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Link to="/products?type=all=true" className="hero-button">Khám phá ngay</Link>
          </motion.div>
        </motion.div>
      </div>
      <div className="hero-indicators">
        {heroImages.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentHeroIndex ? 'active' : ''}`}
            onClick={() => setHeroSlide(index)}
            aria-label={`Slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
});

// Optimized Promo Section
const PromoSection = memo(() => (
  <section className="promo-section">
    <div className="container">
      <motion.div 
        className="promo-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div 
          className="promo-block"
          whileHover={{ y: -10, transition: { duration: 0.3 } }}
        >
          <div className="promo-icon"><FaLeaf /></div>
          <h3>Luôn Tươi Mới</h3>
          <p>Hoa được cắt tươi mỗi ngày từ vườn của chúng tôi</p>
        </motion.div>
        <motion.div 
          className="promo-block"
          whileHover={{ y: -10, transition: { duration: 0.3 } }}
        >
          <div className="promo-icon"><FaShoppingCart /></div>
          <h3>Giao Hàng Nhanh Chóng</h3>
          <p>Miễn phí giao hàng cho đơn từ 500.000đ</p>
        </motion.div>
        <motion.div 
          className="promo-block"
          whileHover={{ y: -10, transition: { duration: 0.3 } }}
        >
          <div className="promo-icon"><FaHeart /></div>
          <h3>Quà Tặng Đặc Biệt</h3>
          <p>Hoàn hảo cho mọi dịp quan trọng</p>
        </motion.div>
      </motion.div>
    </div>
  </section>
));

// Optimized banner section
const BannerSection = memo(() => (
  <section className="banner-section">
    <div className="container">
      <motion.div 
        className="banner-content"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="banner-title">Hoa Tươi Mỗi Ngày</h2>
        <p className="banner-text">Đặt hoa định kỳ và nhận ưu đãi đặc biệt</p>
        <Link to="/subscription" className="banner-button">Tìm hiểu thêm</Link>
      </motion.div>
    </div>
  </section>
));

// Section Header Component
const SectionHeader = memo(({ title, subtitle }) => (
  <div className="section-header">
    <motion.h2 
      className="section-title"
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {title}
    </motion.h2>
    <div className="section-divider">
      <span className="divider-leaf"><FaLeaf /></span>
    </div>
    <motion.p 
      className="section-subtitle"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {subtitle}
    </motion.p>
  </div>
));

// Optimized viewAll section
const ViewAllSection = memo(({ url, label }) => (
  <motion.div 
    className="view-all-section"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <Link to={url} className="view-all-link">
      {label} <FaArrowRight className="icon" />
    </Link>
  </motion.div>
));

class Home extends Component {
  static contextType = MyContext;

  state = {
    newProds: [],
    hotProds: [],
    isLoading: true,
    error: null,
    heroImages: [
      {
        url: "https://images.unsplash.com/photo-1605380155096-ea140dcd1f23?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=70",
        title: "Hoa Tươi Trang Trí",
        subtitle: "Mang vẻ đẹp thiên nhiên vào không gian sống của bạn"
      },
      {
        url: "https://images.unsplash.com/photo-1562690868-60bbe7293e94?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=70",
        title: "Hoa Cho Dịp Đặc Biệt",
        subtitle: "Những bó hoa tinh tế dành tặng người thân yêu"
      },
      {
        url: "https://images.unsplash.com/photo-1532614208657-10b8d7815f40?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=70",
        title: "Hoa Trang Trí Tiệc Cưới",
        subtitle: "Tạo nên không gian lãng mạn cho ngày trọng đại"
      }
    ],
    currentHeroIndex: 0
  };

  componentDidMount() {
    // Clear cache to show the latest products
    sessionStorage.removeItem('newProds');
    sessionStorage.removeItem('hotProds');
    sessionStorage.removeItem('productsTimestamp');
    
    // Listen for product update messages from admin panel
    window.addEventListener('message', this.handleProductUpdates);
    
    // Fetch fresh data
    this.fetchData();
    this.startHeroSlider();
  }

  componentWillUnmount() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
    // Remove event listener
    window.removeEventListener('message', this.handleProductUpdates);
  }

  startHeroSlider = () => {
    this.heroInterval = setInterval(() => {
      this.setState(prevState => ({
        currentHeroIndex: (prevState.currentHeroIndex + 1) % prevState.heroImages.length
      }));
    }, 8000); // 8 second interval between slides
  }

  setHeroSlide = (index) => {
    this.setState({ currentHeroIndex: index });
    // Reset interval for smoother user experience
    clearInterval(this.heroInterval);
    this.startHeroSlider();
  }

  fetchData = async () => {
    try {
      this.setState({ isLoading: true, error: null });

      // Use Promise.all for concurrent API calls
      const [newProdsResponse, hotProdsResponse] = await Promise.all([
        axios.get(`${this.context.apiUrl}/customer/products/new?limit=10&nocache=${new Date().getTime()}`),
        axios.get(`${this.context.apiUrl}/customer/products/hot?limit=10&nocache=${new Date().getTime()}`)
      ]);

      // Filter valid products
      const newProducts = Array.isArray(newProdsResponse.data) 
        ? newProdsResponse.data.filter(product => !!product) 
        : [];

      // Get only valid hot products
      const hotProducts = Array.isArray(hotProdsResponse.data) 
        ? hotProdsResponse.data.filter(product => !!product)
        : [];
        
      // Store in cache
      sessionStorage.setItem('newProds', JSON.stringify(newProducts));
      sessionStorage.setItem('hotProds', JSON.stringify(hotProducts));
      sessionStorage.setItem('productsTimestamp', new Date().getTime().toString());

      this.setState({
        newProds: newProducts,
        hotProds: hotProducts,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      // Clear cache on error
      sessionStorage.removeItem('newProds');
      sessionStorage.removeItem('hotProds');
      sessionStorage.removeItem('productsTimestamp');
      
      this.setState({
        isLoading: false,
        error: 'Không thể tải sản phẩm. Vui lòng thử lại sau.'
      });
    }
  };

  handleProductUpdates = (event) => {
    // Make sure the message is the expected type
    if (event.data && event.data.type === 'PRODUCT_ADDED') {
      console.log('Received product update message, refreshing data');
      // Clear cache
      sessionStorage.removeItem('newProds');
      sessionStorage.removeItem('hotProds');
      sessionStorage.removeItem('productsTimestamp');
      
      // Fetch fresh data
      this.fetchData();
      
      // Show notification
      toast.info('Có sản phẩm mới vừa được thêm!', {
        position: 'bottom-right',
        autoClose: 3000
      });
    }
  }

  render() {
    const { newProds, hotProds, isLoading, error, heroImages, currentHeroIndex } = this.state;
    const { token } = this.context;
    const isLoggedIn = !!token;
  
    if (isLoading) {
      return <LoadingSpinner />;
    }
  
    if (error) {
      return <ErrorDisplay error={error} retry={this.fetchData} />;
    }
  
    return (
      <div className="home-container">
        <HeroSection 
          heroImages={heroImages} 
          currentHeroIndex={currentHeroIndex} 
          setHeroSlide={this.setHeroSlide} 
        />
        
        <PromoSection />
  
        <section className="products-section">
          <div className="container">
            <SectionHeader 
              title="Sản Phẩm Mới" 
              subtitle="Khám phá những mẫu hoa mới nhất của chúng tôi" 
            />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ProductComponent
                products={newProds}
                onAddToCart={this.handleAddToCart}
                onAddToWishlist={this.handleAddToWishlist}
                viewAllUrl="/products?type=new&all=true"
                viewAllLabel="Xem tất cả sản phẩm mới"
                showViewAllButton={true}
                sectionType="new"
                isLoggedIn={isLoggedIn}
                token={token}
              />
            </Suspense>
            
            <ViewAllSection 
              url="/products?type=new&all=true" 
              label="Xem tất cả sản phẩm mới" 
            />
          </div>
        </section>
  
        <BannerSection />
  
        <section className="products-section">
          <div className="container">
            <SectionHeader 
              title="Sản Phẩm Bán Chạy" 
              subtitle="Những mẫu hoa được yêu thích nhất" 
            />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ProductComponent
                products={hotProds}
                onAddToCart={this.handleAddToCart}
                onAddToWishlist={this.handleAddToWishlist}
                viewAllUrl="/products?type=hot&all=true"
                viewAllLabel="Xem tất cả sản phẩm bán chạy"
                showViewAllButton={true}
                sectionType="hot"
                isLoggedIn={isLoggedIn}
                token={token}
              />
            </Suspense>
            
            <ViewAllSection 
              url="/products?type=hot&all=true" 
              label="Xem tất cả sản phẩm bán chạy" 
            />
          </div>
        </section>
      </div>
    );
  }
}

// Using React.memo for CategoryProducts component for better performance
const CategoryProductsWrapper = memo((props) => {
  const params = useParams();
  const location = useLocation();
  return <CategoryProducts {...props} match={{ params }} location={location} />;
});

// Rest of the CategoryProducts class remains unchanged
class CategoryProducts extends Component {
  static contextType = MyContext;

  state = {
    products: [],
    isLoading: true,
    error: null,
    category: null,
    priceFilter: {
      min: null,
      max: null
    },
    currentPage: 1,
    productsPerPage: 10
  };

  componentDidMount() {
    this.fetchProductsByCategory();
  }

  componentDidUpdate(prevProps) {
    // Check if category changed or search params changed
    if (prevProps.match.params.id !== this.props.match.params.id ||
        prevProps.location.search !== this.props.location.search) {
      this.fetchProductsByCategory();
    }
  }

  fetchProductsByCategory = async () => {
    const categoryId = this.props.match.params.id;
    this.setState({ isLoading: true });

    try {
      // Parse URL parameters for price filtering
      const searchParams = new URLSearchParams(this.props.location.search);
      const minPrice = searchParams.get('min');
      const maxPrice = searchParams.get('max');
      const showAll = searchParams.get('all') === 'true';

      // Update state with price filter values
      this.setState({
        priceFilter: {
          min: minPrice ? parseInt(minPrice) : null,
          max: maxPrice ? parseInt(maxPrice) : null
        },
        currentPage: 1 // Reset về trang đầu tiên khi thay đổi danh mục/lọc
      });

      // Build the API URL with price filter parameters if they exist
      let apiUrl = `${this.context.apiUrl}/customer/products/category/${categoryId}`;
      let params = [];
      
      if (minPrice) params.push(`minPrice=${minPrice}`);
      if (maxPrice) params.push(`maxPrice=${maxPrice}`);
      if (showAll) params.push(`all=true`);
      
      if (params.length > 0) {
        apiUrl += '?' + params.join('&');
      }

      console.log('Fetching products with URL:', apiUrl);

      // Fetch the category info for display
      const categoryResponse = await axios.get(`${this.context.apiUrl}/customer/categories/${categoryId}`);

      // Fetch filtered products
      const productsResponse = await axios.get(apiUrl);

      this.setState({
        products: productsResponse.data || [],
        category: categoryResponse.data || { name: 'Danh mục không tồn tại' },
        isLoading: false,
      });
    } catch (error) {
      this.setState({
        error: 'Không thể tải dữ liệu sản phẩm',
        isLoading: false,
      });
      console.error(error);
      toast.error('Có lỗi xảy ra khi tải danh mục sản phẩm');
    }
  };

  handleAddToCart = (product) => {
    console.log('Add to cart from category:', product);
  }

  handleAddToWishlist = (productId) => {
    console.log('Add to wishlist from category:', productId);
  }

  formatCurrency(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

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
      <nav aria-label="Phân trang sản phẩm theo danh mục" className="pagination-container">
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

  renderPriceFilterInfo() {
    const { min, max } = this.state.priceFilter;
    const categoryId = this.props.match.params.id;
    
    if (min === null && max === null) return null;
    
    let filterText = '';
    if (min !== null && max !== null) {
      filterText = `Giá từ ${this.formatCurrency(min)} đến ${this.formatCurrency(max)}`;
    } else if (min !== null) {
      filterText = `Giá từ ${this.formatCurrency(min)} trở lên`;
    } else if (max !== null) {
      filterText = `Giá dưới ${this.formatCurrency(max)}`;
    }
    
    return (
      <div className="price-filter-info">
        <div className="filter-content">
          <p>Đang lọc: {filterText}</p>
          <div className="filter-actions">
            <Link 
              to={`/product/category/${categoryId}`}
              className="clear-filter-button"
            >
              <FaTimes /> Xóa bộ lọc
            </Link>
            <Link 
              to={`/product/category/${categoryId}?all=true`}
              className="view-all-button"
            >
              <span>Xem tất cả sản phẩm</span>
              <FaArrowRight className="icon" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { products, isLoading, error, category, priceFilter, currentPage, productsPerPage } = this.state;
    const { token } = this.context;
    const isLoggedIn = !!token;
  
    // Show title based on price filter
    let pageTitle = category ? category.name : 'Danh mục không tồn tại';
  
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải sản phẩm danh mục...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">!</div>
          <p>Có lỗi xảy ra khi tải danh mục: {error}</p>
          <div className="back-link">
            <Link to="/products" className="back-button">Xem Tất Cả Sản Phẩm</Link>
          </div>
        </div>
      );
    }

    // Lấy sản phẩm cho trang hiện tại
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  
    return (
      <div className="category-products-container">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{pageTitle}</h2>
            
            <div className="section-divider">
              <span className="divider-leaf"><FaLeaf /></span>
            </div>
            
            <p className="section-subtitle">Có {products.length} sản phẩm trong danh mục này</p>
          </div>
  
          {/* Show price filter info if filter is applied */}
          {this.renderPriceFilterInfo()}
  
          <div className="products-wrapper">
            <ProductComponent
              products={currentProducts}
              category={category}
              onAddToCart={this.handleAddToCart}
              onAddToWishlist={this.handleAddToWishlist}
              viewAllUrl={category ? `/product/category/${category._id}?all=true` : ''}
              viewAllLabel="Xem tất cả sản phẩm trong danh mục"
              showViewAllButton={products.length > 10}
              emptyMessage={
                (priceFilter.min !== null || priceFilter.max !== null)
                  ? "Không tìm thấy sản phẩm nào phù hợp với khoảng giá này"
                  : "Hiện chưa có sản phẩm nào trong danh mục này"
              }
              isLoggedIn={isLoggedIn}
              token={token}
            />
          </div>

          {/* Thêm phân trang */}
          {this.renderPagination()}
  
          <div className="back-link">
            <Link to="/products" className="back-button">Xem Tất Cả Sản Phẩm</Link>
          </div>
        </div>
      </div>
    );
  }
}

export { Home, CategoryProductsWrapper as CategoryProducts };