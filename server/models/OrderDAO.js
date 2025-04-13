const mongoose = require('mongoose'); // Nhập thư viện mongoose để tương tác với MongoDB
const Models = require('./Models'); // Nhập các model từ file Models
const CustomerDAO = require('./CustomerDAO'); // Nhập CustomerDAO, giả sử nó đã được định nghĩa chính xác trong dự án của bạn

class OrderDAO {
    // Phương thức để chèn đơn hàng mới vào cơ sở dữ liệu
    static async insert(orderData) {
        const session = await mongoose.startSession(); // Bắt đầu phiên làm việc
        try {
            session.startTransaction(); // Bắt đầu giao dịch
    
            // Kiểm tra và tính tổng giá trị đơn hàng
            const populatedItems = await Promise.all(orderData.items.map(async (item) => {
                const product = await Models.Product.findById(item.product).lean(); // Tìm sản phẩm
                if (!product) throw new Error(`Product ${item.product} not found`); // Nếu không tìm thấy sản phẩm
                if (product.inventory < item.quantity) { // Kiểm tra tồn kho
                    throw new Error(`Insufficient inventory for product ${product.name}`); // Nếu tồn kho không đủ
                }
                return {
                    product: {
                        _id: product._id, // ID sản phẩm
                        name: product.name, // Tên sản phẩm
                        price: product.price, // Giá sản phẩm
                        image: product.image // Ảnh sản phẩm
                    },
                    quantity: item.quantity, // Số lượng được đặt
                    price: product.price // Giá sản phẩm
                };
            }));
    
            // Cập nhật tồn kho
            await Promise.all(populatedItems.map(async (item) => {
                await Models.Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { inventory: -item.quantity } } // Giảm số lượng trong kho
                );
            }));
    
            // Tính tổng giá trị đơn hàng
            const total = populatedItems.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0);
            
            // Xác thực phương thức thanh toán
            let paymentMethod = orderData.paymentMethod || 'cash';
            if (typeof paymentMethod === 'string') {
                paymentMethod = paymentMethod.trim().toLowerCase();
            }
            
            // Đảm bảo paymentMethod chỉ là một trong hai giá trị hợp lệ
            if (paymentMethod !== 'cash' && paymentMethod !== 'transfer') {
                console.warn(`Phương thức thanh toán không hợp lệ: ${paymentMethod}, đặt mặc định là 'cash'`);
                paymentMethod = 'cash';
            }
            
            // Xác thực phương thức vận chuyển
            let deliveryOption = orderData.deliveryOption || 'standard';
            if (typeof deliveryOption === 'string') {
                deliveryOption = deliveryOption.trim().toLowerCase();
            }
            
            // Đảm bảo deliveryOption chỉ là một trong hai giá trị hợp lệ
            if (deliveryOption !== 'standard' && deliveryOption !== 'express') {
                console.warn(`Phương thức vận chuyển không hợp lệ: ${deliveryOption}, đặt mặc định là 'standard'`);
                deliveryOption = 'standard';
            }
            
            console.log(`Tạo đơn hàng mới với phương thức thanh toán: ${paymentMethod}, phương thức vận chuyển: ${deliveryOption}`);
    
            // Tạo đơn hàng mới với trạng thái mặc định là 'pending'
            const order = new Models.Order({
                customer: orderData.customer, // Thông tin khách hàng
                items: populatedItems, // Các mặt hàng trong đơn hàng
                total: orderData.total || total, // Tổng giá trị đơn hàng
                status: orderData.status || 'pending', // Trạng thái đơn hàng
                date: orderData.date || new Date(), // Ngày tạo đơn hàng
                paymentMethod: paymentMethod, // Phương thức thanh toán đã được chuẩn hóa
                deliveryOption: deliveryOption, // Phương thức vận chuyển
                shippingFee: orderData.shippingFee || 0, // Phí vận chuyển
                subtotal: orderData.subtotal || total, // Tổng giá trị trước khi thêm phí vận chuyển
                customerRef: orderData.customerRef, // Tham chiếu đến khách hàng đã đăng ký
                additionalInfo: orderData.additionalInfo || {}, // Thông tin bổ sung
                giftWrap: orderData.giftWrap || false, // Gói quà
                giftMessage: orderData.giftMessage || '', // Tin nhắn quà tặng
                note: orderData.note || '' // Ghi chú
            });
    
            await order.save(); // Lưu đơn hàng vào cơ sở dữ liệu
            await session.commitTransaction(); // Cam kết giao dịch
            
            console.log(`Đơn hàng đã được lưu với ID: ${order._id}, phương thức thanh toán: ${order.paymentMethod}, phương thức vận chuyển: ${order.deliveryOption}`);
            
            return order; // Trả lại đơn hàng đã được lưu
    
        } catch (error) {
            await session.abortTransaction(); // Hủy bỏ giao dịch trong trường hợp có lỗi
            throw error; // Ném lỗi ra ngoài
        } finally {
            session.endSession(); // Kết thúc phiên làm việc
        }
    }

    // Phương thức để lấy tất cả các đơn hàng
    static async selectAll() {
        try {
            const orders = await Models.Order
                .find({})
                .populate('customer', 'name phone address email') // Duyệt qua thông tin khách hàng
                .populate({
                    path: 'items.product',
                    select: 'name image price' // Duyệt qua thông tin sản phẩm trong đơn hàng
                })
                .sort({ date: -1 }) // Sắp xếp theo ngày giảm dần
                .lean() // Chuyển đổi kết quả thành đối tượng JavaScript thuần
                .exec();

            return orders.map(order => ({
                _id: order?._id?.toString() || '', // ID đơn hàng
                customer: {
                    name: order.customer?.name || 'Unknown', // Tên khách hàng
                    phone: order.customer?.phone || 'N/A', // Số điện thoại
                    address: order.customer?.address || 'N/A', // Địa chỉ
                    email: order.customer?.email || 'N/A' // Email
                },
                items: (order.items || []).map(item => ({
                    product: {
                        _id: item.product?._id?.toString() || '', // ID sản phẩm
                        name: item.product?.name || 'Deleted Product', // Tên sản phẩm
                        image: item.product?.image || '', // Ảnh sản phẩm
                        price: item.price || 0 // Giá sản phẩm
                    },
                    quantity: item.quantity || 0, // Số lượng
                    price: item.price || 0 // Giá
                })),
                total: order.total || 0, // Tổng giá trị đơn hàng
                status: order.status || 'pending', // Trạng thái đơn hàng
                date: order.date || new Date(), // Ngày tạo đơn hàng
                paymentMethod: order.paymentMethod || 'cash' // Phương thức thanh toán
            }));
        } catch (error) {
            console.error('Error in OrderDAO.selectAll:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức để chọn đơn hàng theo truy vấn với phân trang
    static async selectByQueryWithPagination(query, sort, skip, limit) {
        try {
            // Fetch orders with pagination from the database
            const orders = await Models.Order.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec();

            console.log(`Tìm thấy ${orders.length} đơn hàng, áp dụng bộ lọc:`, query);

            // Map and format each order before returning
            return orders.map(order => ({
                _id: order._id.toString(),
                customer: {
                    _id: order.customer?._id?.toString(),
                    name: order.customer?.name || 'Khách hàng không xác định',
                    phone: order.customer?.phone || 'N/A',
                    address: order.customer?.address || 'N/A',
                    email: order.customer?.email || 'N/A',
                    isRegistered: !!order.customer?.username
                },
                items: (order.items || []).map(item => ({
                    product: {
                        _id: item.product?._id?.toString(),
                        name: item.product?.name || 'Sản phẩm không còn tồn tại',
                        image: item.product?.image || '',
                        price: item.price || (item.product && item.product.price) || 0
                    },
                    quantity: item.quantity || 0,
                    price: item.price || (item.product && item.product.price) || 0
                })),
                total: order.total,
                subtotal: order.subtotal || order.total || 0,
                shippingFee: order.shippingFee || 0,
                status: order.status || 'pending',
                date: order.date || new Date(), // Ngày tạo đơn hàng
                paymentMethod: (order.paymentMethod === 'cash' || order.paymentMethod === 'transfer') 
                    ? order.paymentMethod 
                    : 'cash', // Đảm bảo paymentMethod là giá trị hợp lệ
                deliveryOption: (order.deliveryOption === 'standard' || order.deliveryOption === 'express') 
                    ? order.deliveryOption 
                    : 'standard', // Đảm bảo deliveryOption là giá trị hợp lệ
                giftWrap: order.giftWrap || false,
                giftMessage: order.giftMessage || '',
                note: order.note || ''
            }));
        } catch (error) {
            console.error('Error in selectByQueryWithPagination:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức đếm số lượng đơn hàng theo truy vấn
    static async count(query) {
        try {
            return await Models.Order.countDocuments(query); // Đếm số lượng đơn hàng phù hợp với truy vấn
        } catch (error) {
            console.error('Error in count:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn đơn hàng theo ID
    static async selectById(id) {
        try {
            const order = await Models.Order.findById(id)
                .populate('customer', 'name phone address email')
                .populate({
                    path: 'items.product',
                    select: 'name image price'
                })
                .lean()
                .exec();

            if (!order) return null; // Nếu không tìm thấy đơn hàng

            // Tính tổng nếu chưa có
            if (!order.total) {
                order.total = order.items.reduce((sum, item) => {
                    const quantity = Number(item.quantity || 0);
                    const price = Number(item.price || (item.product && item.product.price) || 0);
                    return sum + (quantity * price);
                }, 0);
            }

            // Đảm bảo paymentMethod luôn được lấy từ dữ liệu gốc và có giá trị hợp lệ
            const paymentMethod = (order.paymentMethod && 
                (order.paymentMethod === 'cash' || order.paymentMethod === 'transfer')) 
                ? order.paymentMethod 
                : 'cash';

            // Đảm bảo deliveryOption luôn được lấy từ dữ liệu gốc và có giá trị hợp lệ
            const deliveryOption = (order.deliveryOption && 
                (order.deliveryOption === 'standard' || order.deliveryOption === 'express')) 
                ? order.deliveryOption 
                : 'standard';

            console.log(`Order ${id} payment method from database:`, order.paymentMethod);
            console.log(`Order ${id} normalized payment method:`, paymentMethod);
            console.log(`Order ${id} delivery option from database:`, order.deliveryOption);
            console.log(`Order ${id} normalized delivery option:`, deliveryOption);

            // Trả về đơn hàng với dữ liệu đã được chuẩn hóa
            return {
                ...order,
                paymentMethod,
                deliveryOption,
                shippingFee: order.shippingFee || 0,
                subtotal: order.subtotal || order.total || 0
            };
        } catch (error) {
            console.error('Error in OrderDAO.selectById:', error);
            throw error;
        }
    }
    
    // Thêm phương thức cập nhật cho class OrderDAO
    static async update(id, updateData) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID đơn hàng không hợp lệ'); // Kiểm tra tính hợp lệ của ID
            }

            const result = await Models.Order.findByIdAndUpdate(
                id,
                { $set: updateData }, // Cập nhật các trường theo dữ liệu truyền vào
                {
                    new: true, // Trả về bản ghi mới đã cập nhật
                    runValidators: true // Chạy các bộ quy tắc xác thực
                }
            );

            if (!result) {
                throw new Error('Đơn hàng không tồn tại'); // Nếu không tìm thấy đơn hàng
            }

            return result; // Trả về kết quả đã cập nhật
        } catch (error) {
            console.error('Error in OrderDAO.update:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức cập nhật trạng thái đơn hàng
    static async updateStatus(id, status) {
        try {
            console.log(`===== UPDATING ORDER STATUS =====`);
            console.log(`Order ID: ${id}`);
            console.log(`New status: ${status}`);
    
            const order = await Models.Order.findById(id);
            if (!order) {
                throw new Error(`Không tìm thấy đơn hàng với ID: ${id}`); // Nếu không tìm thấy đơn hàng
            }
    
            const oldStatus = order.status; // Lưu trạng thái cũ của đơn hàng
            if (oldStatus === status) {
                return order; // Nếu trạng thái không thay đổi
            }
    
            // Cập nhật trạng thái đơn hàng
            order.status = status;
            await order.save();
    
            // Chỉ cập nhật tổng chi tiêu của khách hàng khi:
            // 1. Chuyển sang trạng thái "delivered" (cộng vào tổng chi tiêu)
            // 2. Chuyển từ "delivered" sang trạng thái khác (trừ khỏi tổng chi tiêu)
            if ((status === 'delivered' && oldStatus !== 'delivered') ||
                (status !== 'delivered' && oldStatus === 'delivered')) {
    
                let customerInfo = order.customer;
                let customer = null;
    
                // Tìm khách hàng
                if (customerInfo) {
                    if (typeof customerInfo === 'object') {
                        if (customerInfo.email) {
                            customer = await Models.Customer.findOne({ email: customerInfo.email }); // Tìm khách hàng theo email
                        }
                        if (!customer && customerInfo.phone) {
                            customer = await Models.Customer.findOne({ phone: customerInfo.phone }); // Tìm khách hàng theo số điện thoại
                        }
                    } else if (mongoose.Types.ObjectId.isValid(customerInfo)) {
                        customer = await Models.Customer.findById(customerInfo); // Tìm khách hàng theo ID
                    }
                }
    
                if (customer) {
                    // Tính tổng giá trị đơn hàng
                    const orderTotal = order.items.reduce((total, item) => {
                        return total + (item.price * item.quantity); // Tính tổng giá trị đơn hàng
                    }, 0);
    
                    // Cập nhật tổng chi tiêu
                    if (status === 'delivered') {
                        // Cộng vào tổng chi tiêu khi đơn hàng được giao
                        customer.totalSpent = (customer.totalSpent || 0) + orderTotal;
                    } else if (oldStatus === 'delivered') {
                        // Trừ khỏi tổng chi tiêu khi đơn hàng bị hủy hoặc thay đổi trạng thái
                        customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - orderTotal);
                    }
    
                    await customer.save(); // Lưu thay đổi khách hàng
                }
            }
    
            return order; // Trả về đơn hàng đã cập nhật trạng thái
    
        } catch (error) {
            console.error('Error in OrderDAO.updateStatus:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy sản phẩm bán chạy nhất
    static async getTopProducts(limit = 5) {
        try {
            return await Models.Order.aggregate([
                { $unwind: "$items" }, // Phân tách các mặt hàng
                {
                    $group: {
                        _id: "$items.product", // Nhóm theo sản phẩm
                        count: { $sum: "$items.quantity" } // Tính tổng số lượng
                    }
                },
                {
                    $lookup: {
                        from: "products", // Liên kết với bảng sản phẩm
                        localField: "_id", // Trường phù hợp trong bảng này
                        foreignField: "_id", // Trường phù hợp trong bảng sản phẩm
                        as: "product" // Tên trường để lưu kết quả
                    }
                },
                { $unwind: "$product" }, // Phân tách sản phẩm
                {
                    $project: {
                        _id: {
                            name: "$product.name", // Tên sản phẩm
                            id: "$product._id" // ID sản phẩm
                        },
                        count: 1 // Tính số lượng
                    }
                },
                { $sort: { count: -1 } }, // Sắp xếp theo số lượng giảm dần
                { $limit: limit } // Giới hạn số lượng kết quả
            ]);
        } catch (error) {
            console.error('Error in getTopProducts:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn các đơn hàng gần đây
    static async selectRecent(limit = 10) {
        try {
            const orders = await Models.Order.find()
                .sort({ date: -1 }) // Sắp xếp theo ngày giảm dần
                .limit(limit) // Giới hạn số lượng đơn hàng
                .populate('customer', 'name') // Duyệt thông tin khách hàng
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order?._id?.toString() || '', // ID đơn hàng
                customer: {
                    name: order.customer?.name || 'Unknown Customer' // Tên khách hàng
                },
                status: order.status || 'pending', // Trạng thái
                date: order.date || new Date(), // Ngày tạo
                paymentMethod: order.paymentMethod || 'cash', // Phương thức thanh toán
                total: order.total || 0 // Tổng giá trị
            }));
        } catch (error) {
            console.error('Error in selectRecent:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn tất cả đơn hàng đã xác minh
    static async selectAllVerified() {
        try {
            const orders = await Models.Order
                .find({})
                .populate({
                    path: 'customer',
                    select: 'username _id' // Chọn trường username và ID khách hàng
                })
                .populate({
                    path: 'items.product',
                    select: 'name price _id' // Chọn trường tên, giá và ID sản phẩm
                })
                .sort({ date: -1 }) // Sắp xếp theo ngày giảm dần
                .lean()
                .exec();

            return orders
                .filter(order =>
                    order &&
                    order.customer &&
                    Array.isArray(order.items) &&
                    order.items.every(item => item && item.product)
                )
                .map(order => ({
                    _id: order?._id?.toString() || '', // ID đơn hàng
                    customer: {
                        _id: order.customer?._id?.toString() || '', // ID khách hàng
                        username: order.customer?.username || '' // Tên người dùng
                    },
                    items: order.items.map(item => ({
                        product: {
                            _id: item.product?._id?.toString() || '', // ID sản phẩm
                            name: item.product?.name || '', // Tên sản phẩm
                            price: item.product?.price || 0 // Giá sản phẩm
                        },
                        quantity: item.quantity || 0, // Số lượng
                        price: item.price || 0 // Giá
                    })),
                    total: order.total || 0, // Tổng giá trị đơn hàng
                    status: order.status || 'pending', // Trạng thái đơn hàng
                    date: order.date || new Date() // Ngày tạo đơn hàng
                }));
        } catch (error) {
            console.error('Error in selectAllVerified:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức xóa đơn hàng theo ID
    static async delete(id) {
        try {
            return await Models.Order.findByIdAndDelete(id); // Xóa đơn hàng
        } catch (error) {
            console.error('Error in OrderDAO.delete:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn đơn hàng theo trạng thái
    static async selectByStatus(status) {
        try {
            const orders = await Models.Order.find({ status: status }) // Tìm theo trạng thái
                .populate('customer') // Duyệt thông tin khách hàng
                .populate({
                    path: 'items.product',
                    select: 'name image price' // Duyệt thông tin sản phẩm
                })
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order._id.toString(), // ID đơn hàng
                customer: order.customer ? {
                    _id: order.customer._id.toString(), // ID khách hàng
                    name: order.customer.name || '', // Tên khách hàng
                    phone: order.customer.phone || '', // Số điện thoại
                    email: order.customer.email || '', // Email
                    address: order.customer.address || '' // Địa chỉ
                } : null,
                items: order.items.map(item => ({
                    product: {
                        _id: item.product?._id.toString() || '', // ID sản phẩm
                        name: item.product?.name || 'Sản phẩm không còn tồn tại', // Tên sản phẩm
                        image: item.product?.image || '', // Ảnh sản phẩm
                        price: item.price || 0 // Giá sản phẩm
                    },
                    quantity: item.quantity || 0, // Số lượng
                    price: item.price || 0 // Giá sản phẩm
                })),
                total: order.total || 0, // Tổng giá trị đơn hàng
                status: order.status, // Trạng thái đơn hàng
                date: order.date || new Date(), // Ngày tạo đơn hàng
                paymentMethod: order.paymentMethod || 'cash' // Phương thức thanh toán
            }));
        } catch (error) {
            console.error('Error in selectByStatus:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy doanh thu theo khoảng thời gian
    static async getRevenueByDate(startDate, endDate) {
        try {
            // Chuyển đổi chuỗi ngày thành đối tượng Date
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Đặt thời gian cuối của ngày cho ngày kết thúc
            end.setHours(23, 59, 59, 999);

            // Tìm đơn hàng trong khoảng thời gian
            const orders = await Models.Order.find({
                date: {
                    $gte: start, // Ngày bắt đầu
                    $lte: end // Ngày kết thúc
                },
                status: 'delivered' // Chỉ lấy đơn hàng đã giao
            }).lean();

            // Nhóm doanh thu theo ngày
            const revenueByDate = {};

            orders.forEach(order => {
                // Định dạng ngày dưới dạng chuỗi địa phương (ví dụ: "dd/mm/yyyy")
                const dateObj = new Date(order.date);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                // Khởi tạo hoặc cộng vào doanh thu hàng ngày
                if (!revenueByDate[dateStr]) {
                    revenueByDate[dateStr] = 0;
                }

                revenueByDate[dateStr] += order.total || 0; // Cộng tổng doanh thu
            });

            // Chuyển đổi sang định dạng mảng cho phản hồi API
            const result = Object.keys(revenueByDate).map(date => ({
                date,
                revenue: revenueByDate[date] // Doanh thu theo ngày
            }));

            return result.sort((a, b) => {
                // Sắp xếp theo ngày 
                const dateA = new Date(a.date.split('/').reverse().join('-'));
                const dateB = new Date(b.date.split('/').reverse().join('-'));
                return dateA - dateB; // So sánh hai ngày
            });
        } catch (error) {
            console.error('Error in getRevenueByDate:', error); // Ghi log lỗi
            throw new Error(`Error getting revenue data: ${error.message}`); // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy thống kê đơn hàng theo trạng thái
    static async getOrderStatsByStatus(startDate, endDate) {
        try {
            // Chuyển đổi chuỗi ngày thành đối tượng Date
            const start = new Date(startDate);
            const end = new Date(endDate); // Ngày kết thúc
            end.setHours(23, 59, 59, 999); // Đặt thời gian cuối của ngày

            // Tìm đơn hàng trong khoảng thời gian
            const orders = await Models.Order.find({
                date: {
                    $gte: start, // Ngày bắt đầu
                    $lte: end // Ngày kết thúc
                }
            }).lean();

            // Đếm đơn hàng theo trạng thái
            const orderStats = {
                pending: 0,
                processing: 0,
                shipping: 0,
                delivered: 0,
                cancelled: 0,
                total: orders.length // Tổng số đơn hàng
            };

            orders.forEach(order => {
                if (orderStats.hasOwnProperty(order.status)) {
                    orderStats[order.status]++; // Tăng số lượng đơn hàng theo trạng thái
                }
            });

            return orderStats; // Trả về thống kê
        } catch (error) {
            console.error('Error in getOrderStatsByStatus:', error); // Ghi log lỗi
            throw new Error(`Error getting order statistics: ${error.message}`); // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy thống kê chung
    static async getGeneralStats(startDate, endDate) {
        try {
            const start = new Date(startDate); // Ngày bắt đầu
            const end = new Date(endDate); // Ngày kết thúc
            end.setHours(23, 59, 59, 999); // Đặt thời gian cuối của ngày
    
            // Chỉ tính doanh thu từ các đơn hàng đã giao
            const orders = await Models.Order.find({
                date: {
                    $gte: start, // Ngày bắt đầu
                    $lte: end // Ngày kết thúc
                },
                status: 'delivered' // Chỉ tính đơn hàng đã giao
            }).populate('customer').lean();
    
            // Tính tổng doanh thu từ đơn hàng đã giao
            const totalRevenue = orders.reduce((sum, order) => {
                return sum + (order.total || 0); // Cộng tổng doanh thu
            }, 0);
    
            // Đếm số khách hàng duy nhất
            const uniqueCustomers = new Set();
            orders.forEach(order => {
                if (order.customer && order.customer._id) {
                    uniqueCustomers.add(order.customer._id.toString()); // Thêm ID khách hàng vào Set
                }
            });
    
            // Tính giá trị đơn hàng trung bình
            const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
            return {
                totalRevenue, // Tổng doanh thu
                totalOrders: orders.length, // Tổng số đơn hàng
                totalCustomers: uniqueCustomers.size, // Tổng số khách hàng duy nhất
                avgOrderValue // Giá trị đơn hàng trung bình
            };
        } catch (error) {
            console.error('Error in getGeneralStats:', error); // Ghi log lỗi
            throw new Error(`Error getting general statistics: ${error.message}`); // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn đơn hàng theo ID khách hàng
    static async selectByCustomerId(customerId) {
        try {
            console.log('Searching orders for customer:', customerId);

            const orders = await Models.Order
                .find({
                    $or: [
                        { 'customer._id': customerId }, // Tìm theo ID khách hàng
                        { 'customer': customerId } // Tìm theo khách hàng
                    ]
                })
                .sort({ date: -1 }) // Sắp xếp theo ngày giảm dần
                .populate('items.product') // Duyệt thông tin sản phẩm
                .lean();

            console.log(`Found ${orders.length} orders`); // Ghi log số lượng đơn hàng tìm thấy

            return orders; // Trả về danh sách đơn hàng
        } catch (error) {
            console.error('Error in selectByCustomerId:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Find orders for a specific customer that contain a specific product
    static async findOrdersByCustomerAndProduct(customerId, productId) {
        try {
            // Ensure we have valid ObjectIds
            const customerObjId = new mongoose.Types.ObjectId(customerId);
            const productObjId = new mongoose.Types.ObjectId(productId);
            
            // Find orders that have this customer reference and contain the product
            const orders = await Models.Order.find({
                customerRef: customerObjId,
                'items.product': productObjId
            }).sort({ date: -1 });
            
            return orders;
        } catch (error) {
            console.error('Error finding orders by customer and product:', error);
            return [];
        }
    }
}
module.exports = OrderDAO; // Xuất class OrderDAO
