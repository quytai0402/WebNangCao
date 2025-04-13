const mongoose = require('mongoose'); // Nhập thư viện mongoose để làm việc với MongoDB
const Schema = mongoose.Schema; // Tạo alias cho Schema từ mongoose

// Định nghĩa Schema cho Admin
const AdminSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId, // ID duy nhất cho admin
    username: { type: String, required: true }, // Tên người dùng là bắt buộc
    password: { type: String, required: true } // Mật khẩu là bắt buộc
}, { versionKey: false }); // Không sử dụng khóa phiên bản

// Định nghĩa Schema cho Category
const CategorySchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId, // ID duy nhất cho category
    name: { type: String, required: true } // Tên danh mục là bắt buộc
}, { versionKey: false }); // Không sử dụng khóa phiên bản

// Định nghĩa Schema cho Customer
const CustomerSchema = new Schema({
    username: { type: String, sparse: true, unique: true }, // Tên người dùng phải là duy nhất
    password: { type: String }, // Mật khẩu
    name: { type: String, required: true }, // Tên khách hàng là bắt buộc
    phone: { type: String, required: true }, // Số điện thoại là bắt buộc
    email: { type: String }, // Email
    status: {
        type: String,
        enum: ['active', 'inactive'], // Giá trị có thể là active hoặc inactive
        default: 'active' // Trạng thái mặc định là active
    },
    active: {
        type: Boolean,
        default: true // Khách hàng đang hoạt động mặc định là true
    },
    isRegistered: {
        type: Boolean,
        default: false // Khách hàng đã đăng ký mặc định là false
    },
    isAdmin: {
        type: Boolean,
        default: false // Đánh dấu tài khoản có phải là admin không
    },
    totalOrders: {
        type: Number,
        default: 0 // Tổng số đơn hàng mặc định là 0
    },
    totalSpent: {
        type: Number,
        default: 0 // Tổng tiền đã chi tiêu mặc định là 0
    },
    // Thêm các trường bổ sung vào schema Customer
    resetPasswordToken: String, // Token để đặt lại mật khẩu
    resetPasswordExpires: Date, // Thời gian hết hạn của token đặt lại mật khẩu
    activationToken: String, // Token kích hoạt tài khoản
    activationExpires: Date, // Thời gian hết hạn của token kích hoạt
    joinDate: {
        type: Date,
        default: Date.now // Ngày tham gia mặc định là thời điểm hiện tại
    },
    cart: [{ // Giỏ hàng của khách hàng
        product: {
            type: Schema.Types.ObjectId, // Tham chiếu đến sản phẩm
            ref: 'Product' // Liên kết đến model Product
        },
        quantity: Number // Số lượng sản phẩm trong giỏ hàng
    }],
    token: String // Token xác thực
}, {
    versionKey: false, // Không sử dụng khóa phiên bản
    timestamps: true // Tự động tạo trường createdAt và updatedAt
});

// Định nghĩa Schema cho Product
const ProductSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId, // ID duy nhất cho sản phẩm
    name: { type: String, required: true }, // Tên sản phẩm là bắt buộc
    description: { type: String }, // Mô tả sản phẩm
    price: { type: Number, required: true }, // Giá sản phẩm là bắt buộc
    category: {
        type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến danh mục
        ref: 'Category' // Liên kết đến model Category
    },
    stock: {
        type: Number,
        default: 0 // Số lượng hàng tồn kho mặc định là 0
    },
    image: String, // Hình ảnh sản phẩm
    createdAt: {
        type: Date,
        default: Date.now // Ngày tạo sản phẩm mặc định là thời điểm hiện tại
    }
}, { versionKey: false }); // Không sử dụng khóa phiên bản

// Định nghĩa Schema cho Item trong Order
const ItemSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến sản phẩm
        ref: 'Product',
        required: true // Sản phẩm là bắt buộc
    },
    quantity: {
        type: Number,
        required: true // Số lượng là bắt buộc
    },
    price: {
        type: Number,
        required: true // Giá là bắt buộc
    },
    total: {
        type: Number,
        default: function () { // Tính toán tổng
            return this.quantity * this.price; // Tổng = số lượng * giá
        }
    }
}, {
    versionKey: false, // Không sử dụng khóa phiên bản
    _id: false // Không tạo ID riêng cho schema này
});

// Định nghĩa Schema cho Order
const OrderSchema = new Schema({
    customer: { // Thông tin khách hàng
        name: { type: String, required: true }, // Tên khách hàng là bắt buộc
        phone: { type: String, required: true }, // Số điện thoại là bắt buộc
        address: { type: String, required: true }, // Địa chỉ là bắt buộc
        email: { type: String, required: true } // Email là bắt buộc
    },
    items: [ItemSchema], // Danh sách các mặt hàng trong đơn hàng
    subtotal: {
        type: Number,
        required: false,
        default: 0
    },
    shippingFee: {
        type: Number,
        required: false,
        default: 0
    },
    total: {
        type: Number,
        required: true // Tổng giá trị là bắt buộc
    },
    status: {
        type: String,
        required: true,
        default: 'pending', // Trạng thái mặc định là đang chờ
        enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled'] // Các trạng thái có thể có
    },
    // Thêm trường paymentMethod vào schema
    paymentMethod: {
        type: String,
        enum: ['cash', 'transfer'], // Phương thức thanh toán có thể là tiền mặt hoặc chuyển khoản
        default: 'cash', // Mặc định là tiền mặt
        required: true // Bắt buộc phải có phương thức thanh toán
    },
    // Thêm trường deliveryOption để lưu phương thức vận chuyển
    deliveryOption: {
        type: String,
        enum: ['standard', 'express'], // Phương thức vận chuyển: tiêu chuẩn hoặc nhanh
        default: 'standard', // Mặc định là giao hàng tiêu chuẩn
    },
    // Thêm trường customer để tham chiếu đến khách hàng đã đăng ký
    customerRef: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: false // Không bắt buộc
    },
    // Thêm trường additionalInfo để lưu thông tin bổ sung
    additionalInfo: {
        type: Object,
        default: {} // Mặc định là đối tượng rỗng
    },
    date: {
        type: Date,
        default: Date.now // Ngày tạo đơn hàng mặc định là thời điểm hiện tại
    }
}, {
    versionKey: false, // Không sử dụng khóa phiên bản
    timestamps: true // Tự động tạo trường createdAt và updatedAt
});

// Định nghĩa Schema cho Comment
const CommentSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: function() {
            // Chỉ bắt buộc đánh giá nếu là bình luận gốc (không phải trả lời)
            return this.parentId === null || this.parentId === undefined;
        }
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    // Danh sách tên người dùng được đề cập trong nội dung (@username)
    mentions: [String],
    // Thông tin về người dùng được trả lời (nếu đây là bình luận phản hồi)
    replyTo: {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        name: String,
        username: String
    },
    // Thông tin người dùng được trả lời trực tiếp (khi trả lời comment con)
    replyToUser: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        name: String,
        username: String
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

// Thêm chỉ mục để cải thiện hiệu suất truy vấn
CustomerSchema.index({ username: 1 }, { unique: true }); // Chỉ mục duy nhất cho username
CustomerSchema.index({ email: 1 }, { unique: true }); // Chỉ mục duy nhất cho email
CustomerSchema.index({ phone: 1 }); // Chỉ mục cho phone
CustomerSchema.index({ status: 1 }); // Chỉ mục cho status
CustomerSchema.index({ active: 1 }); // Chỉ mục cho active

ProductSchema.index({ name: 1 }); // Chỉ mục cho name
ProductSchema.index({ category: 1 }); // Chỉ mục cho category
ProductSchema.index({ price: 1 }); // Chỉ mục cho price

OrderSchema.index({ 'customer.email': 1 }); // Chỉ mục cho email của khách hàng trong đơn hàng
OrderSchema.index({ status: 1 }); // Chỉ mục cho status
OrderSchema.index({ date: -1 }); // Chỉ mục cho date theo thứ tự giảm dần
OrderSchema.index({ paymentMethod: 1 }); // Chỉ mục cho paymentMethod

CommentSchema.index({ product: 1 });
CommentSchema.index({ customer: 1 });
CommentSchema.index({ createdAt: -1 });
CommentSchema.index({ parentId: 1 });

// Định nghĩa Schema cho Wishlist
const WishlistSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { 
    versionKey: false
});

// Tạo chỉ mục để đảm bảo một khách hàng không thêm cùng một sản phẩm vào wishlist nhiều lần
WishlistSchema.index({ customer: 1, product: 1 }, { unique: true });

// Tạo các model từ schema đã định nghĩa
const Admin = mongoose.model('Admin', AdminSchema); // Model cho Admin
const Category = mongoose.model('Category', CategorySchema); // Model cho Category
const Customer = mongoose.model('Customer', CustomerSchema); // Model cho Customer
const Product = mongoose.model('Product', ProductSchema); // Model cho Product
const Order = mongoose.model('Order', OrderSchema); // Model cho Order
const Comment = mongoose.model('Comment', CommentSchema); // Model cho Comment
const Wishlist = mongoose.model('Wishlist', WishlistSchema); // Model cho Wishlist

// Xuất các model để sử dụng ở nơi khác
module.exports = {
    Admin,
    Category,
    Customer,
    Product,
    Order,
    Comment,
    Wishlist
};
