import { toast } from 'react-toastify'; // Nhập thư viện toast để hiển thị thông báo
class CartService {
    // Phương thức thêm sản phẩm vào giỏ hàng
    static async addToCart(product, quantity = 1, token = null, showNotification = true) {
        try {
            // Xử lý cho cả hai trường hợp đăng nhập và chưa đăng nhập
            let cart = JSON.parse(localStorage.getItem('cart') || '[]'); // Lấy giỏ hàng từ localStorage hoặc khởi tạo mảng rỗng
            const existingItem = cart.find(item => item.product._id === product._id); // Tìm sản phẩm đã tồn tại trong giỏ hàng

            if (existingItem) {
                existingItem.quantity += quantity; // Nếu sản phẩm đã có, tăng số lượng lên
            } else {
                cart.push({ product, quantity }); // Nếu không, thêm sản phẩm mới vào giỏ hàng
            }

            // Lưu giỏ hàng vào localStorage 
            localStorage.setItem('cart', JSON.stringify(cart));

            // Kích hoạt sự kiện cập nhật giỏ hàng
            window.dispatchEvent(new CustomEvent('cartUpdated'));

            // Hiển thị thông báo thành công nếu showNotification là true
            if (showNotification) {
                this.showSuccessToast(product.name);
            }
            
            return true; // Trả về true nếu thành công
        } catch (error) {
            console.error('Add to cart error:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức hiển thị thông báo thành công
    static showSuccessToast(productName) {
        toast.success(`Đã thêm "${productName}" vào giỏ hàng!`, {
            position: "top-right", // Vị trí hiển thị thông báo
            autoClose: 2000, // Thời gian tự động đóng
            hideProgressBar: false, // Hiện thanh tiến trình
            closeOnClick: true, // Đóng khi nhấn vào thông báo
            pauseOnHover: true, // Tạm dừng khi di chuột vào
            draggable: true, // Cho phép kéo thả thông báo
            toastId: `add-to-cart-${productName.replace(/\s+/g, '-').toLowerCase()}` // Unique toastId based on product name
        });
    }
}
export default CartService; // Xuất class CartService
