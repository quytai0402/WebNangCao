import React, { Component } from 'react'; // Nhập thư viện React và Component từ React
import axios from 'axios'; // Nhập thư viện axios để thực hiện các yêu cầu HTTP
import { Link } from 'react-router-dom'; // Nhập component Link từ react-router-dom để điều hướng
import { FaLeaf } from 'react-icons/fa'; // Nhập biểu tượng lá từ react-icons
import ProductComponent from './ProductComponent'; // Nhập component hiển thị sản phẩm
import { toast } from 'react-toastify'; // Nhập thư viện toastify để hiển thị thông báo
import '../styles/AllProductsComponent.css'; // Nhập file CSS cho component này
import CartService from './services/CartService'; // Nhập dịch vụ giỏ hàng
import MyContext from '../contexts/MyContext'; // Nhập context để quản lý trạng thái

class AllProducts extends Component {
    static contextType = MyContext; // Xác định context mà component sẽ sử dụng

    constructor(props) {
        super(props); // Gọi hàm khởi tạo của lớp cha
        this.state = {
            products: [], // Danh sách sản phẩm
            isLoading: true, // Trạng thái loading mặc định là true
            error: null, // Biến lưu trữ lỗi nếu có
            productType: null, // Loại sản phẩm (new, hot)
            title: "Tất Cả Sản Phẩm", // Tiêu đề mặc định
            currentPage: 1, // Trang hiện tại
            productsPerPage: 10 // Số sản phẩm trên mỗi trang
        };
    }

    componentDidMount() {
        // Hàm này được gọi ngay sau khi component được gắn vào DOM

        // Lấy loại sản phẩm từ URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type'); // Lấy loại sản phẩm từ tham số type
        const all = urlParams.get('all'); // Lấy tham số all
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
            showAllProducts: all === 'true', // Kiểm tra xem có cần hiển thị tất cả sản phẩm không
            currentPage: page // Cập nhật trang hiện tại
        }, () => {
            this.loadProducts(); // Gọi hàm loadProducts để tải sản phẩm
        });
    }

    componentDidUpdate(prevProps) {
        // Hàm này được gọi khi props của component thay đổi
        // Kiểm tra sự thay đổi trong URL và cập nhật nếu cần
        const prevSearch = prevProps.location?.search || window.location.search; // Lấy search query trước đó
        const currentSearch = this.props.location?.search || window.location.search; // Lấy search query hiện tại

        if (prevSearch !== currentSearch) { // Nếu search query đã thay đổi
            const urlParams = new URLSearchParams(currentSearch);
            const type = urlParams.get('type'); // Lấy lại loại sản phẩm
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
                this.loadProducts(); // Gọi hàm loadProducts để tải sản phẩm
            });
        }
    }

    loadProducts = async () => {
        // Hàm tải sản phẩm từ API
        try {
          this.setState({ isLoading: true }); // Đặt trạng thái loading
          const { productType } = this.state; // Lấy loại sản phẩm từ state
          let url = '/api/customer/products'; // URL mặc định để lấy sản phẩm
          
          // Thêm param all=true để lấy tất cả sản phẩm
          if (productType === 'new') {
            url = `/api/customer/products/new?all=true`; // URL cho sản phẩm mới
          } else if (productType === 'hot') {
            url = `/api/customer/products/hot?all=true`; // URL cho sản phẩm bán chạy
          }
      
          const response = await axios.get(url); // Gửi yêu cầu GET để lấy dữ liệu
          console.log(`Received ${response.data.length} products`); // In ra số lượng sản phẩm nhận được
              
          this.setState({
            products: response.data || [], // Cập nhật danh sách sản phẩm
            isLoading: false // Đặt trạng thái loading thành false
          });
        } catch (error) {
          console.error('Error fetching products:', error); // In lỗi ra console
          this.setState({
            error: 'Không thể tải sản phẩm. Vui lòng thử lại sau.', // Cập nhật thông điệp lỗi
            isLoading: false  
          });
          toast.error('Lỗi khi tải sản phẩm'); // Hiển thị thông báo lỗi
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
        const { products, isLoading, error, title, currentPage, productsPerPage } = this.state;
        const { token } = this.context;
        const isLoggedIn = !!token;

        if (isLoading) {
            return (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="error-container">
                    <h3>Đã xảy ra lỗi</h3>
                    <p>{error}</p>
                    <button onClick={this.loadProducts}>Thử lại</button>
                </div>
            );
        }

        // Get current products for pagination
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

        return (
            <div className="category-products-container">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{title}</h2>
                        
                        <div className="section-divider">
                            <span className="divider-leaf"><FaLeaf /></span>
                        </div>
                        
                        <p className="section-subtitle">
                            Có {products.length} sản phẩm
                        </p>
                    </div>

                    <div className="products-wrapper">
                        <ProductComponent
                            products={currentProducts}
                            emptyMessage="Không có sản phẩm nào để hiển thị."
                            onAddToCart={this.handleAddToCart}
                            onAddToWishlist={this.handleAddToWishlist}
                            isLoggedIn={isLoggedIn}
                            token={token}
                        />
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
