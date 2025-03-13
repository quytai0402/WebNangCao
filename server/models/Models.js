const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema definitions
const AdminSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: { type: String, required: true },
    password: { type: String, required: true }
}, { versionKey: false });

const CategorySchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true }
}, { versionKey: false });

const CustomerSchema = new Schema({
    username: { type: String, sparse: true, unique: true },
    password: { type: String },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    active: {
        type: Boolean,
        default: true
    },
    isRegistered: {
        type: Boolean,
        default: false
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    // Thêm các trường này vào schema Customer
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    activationToken: String,
    activationExpires: Date,
    joinDate: {
        type: Date,
        default: Date.now
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    cart: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number
    }],
    token: String
}, {
    versionKey: false,
    timestamps: true
});

const ProductSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    stock: {
        type: Number,
        default: 0
    },
    image: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

const ItemSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        default: function () {
            return this.quantity * this.price;
        }
    }
}, {
    versionKey: false,
    _id: false
});
const WishlistSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer',
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

// Index để tối ưu truy vấn
WishlistSchema.index({ customer: 1 });


const OrderSchema = new Schema({
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        email: { type: String, required: true }
    },
    items: [ItemSchema],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled']
    },
    // Thêm trường paymentMethod vào schema
    paymentMethod: {
        type: String,
        enum: ['cash', 'transfer'],
        default: 'cash',
        required: true
    },
    // Thêm trường customer để tham chiếu đến khách hàng đã đăng ký
    customerRef: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    // Thêm trường additionalInfo để lưu thông tin bổ sung
    additionalInfo: {
        type: Object,
        default: {}
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    timestamps: true
});

// Add indexes for better query performance
CustomerSchema.index({ username: 1 }, { unique: true });
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ active: 1 });

ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });

OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ date: -1 });
OrderSchema.index({ paymentMethod: 1 }); // Thêm index cho paymentMethod

// Create models
const Admin = mongoose.model('Admin', AdminSchema);
const Category = mongoose.model('Category', CategorySchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);


// Export models
module.exports = {
    Admin,
    Category,
    Customer,
    Product,
    Order
};