const mongoose = require('mongoose');
const Models = require('./Models');
const CustomerDAO = require('./CustomerDAO'); // Assuming this is correctly defined in your project

class OrderDAO {
    static async insert(orderData) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Get full product details and check inventory
            const populatedItems = await Promise.all(orderData.items.map(async (item) => {
                const product = await Models.Product.findById(item.product).lean();
                if (!product) throw new Error(`Product ${item.product} not found`);
                if (product.inventory < item.quantity) {
                    throw new Error(`Insufficient inventory for product ${product.name}`);
                }
                return {
                    product: {
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.image
                    },
                    quantity: item.quantity,
                    price: product.price
                };
            }));

            // Update inventory
            await Promise.all(populatedItems.map(async (item) => {
                await Models.Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { inventory: -item.quantity } }
                );
            }));

            // Create order
            const total = populatedItems.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0);

            const order = new Models.Order({
                customer: orderData.customer,
                items: populatedItems,
                total: total,
                status: 'pending',
                date: new Date()
            });

            await order.save();
            await session.commitTransaction();
            return order;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async selectAll() {
        try {
            const orders = await Models.Order
                .find({})
                .populate('customer', 'name phone address email')
                .populate({
                    path: 'items.product',
                    select: 'name image price'
                })
                .sort({ date: -1 })
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order?._id?.toString() || '',
                customer: {
                    name: order.customer?.name || 'Unknown',
                    phone: order.customer?.phone || 'N/A',
                    address: order.customer?.address || 'N/A',
                    email: order.customer?.email || 'N/A'
                },
                items: (order.items || []).map(item => ({
                    product: {
                        _id: item.product?._id?.toString() || '',
                        name: item.product?.name || 'Deleted Product',
                        image: item.product?.image || '',
                        price: item.price || 0
                    },
                    quantity: item.quantity || 0,
                    price: item.price || 0
                })),
                total: order.total || 0,
                status: order.status || 'pending',
                date: order.date || new Date()
            }));
        } catch (error) {
            console.error('Error in OrderDAO.selectAll:', error);
            throw error;
        }
    }

    static async selectByQueryWithPagination(query, sort, skip, limit) {
        try {
            const orders = await Models.Order.find(query)
                .populate('customer', 'name phone address email')
                .populate({
                    path: 'items.product',
                    select: 'name image price'
                })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order?._id?.toString() || '',
                customer: {
                    name: order.customer?.name || 'Không Xác Định',
                    phone: order.customer?.phone || 'Không Xác Định',
                    address: order.customer?.address || 'Không Xác Định',
                    email: order.customer?.email || 'Không Xác Định'
                },
                items: (order.items || []).map(item => ({
                    product: {
                        _id: item.product?._id?.toString() || '',
                        name: item.product?.name || 'Deleted Product',
                        image: item.product?.image || '',
                        price: item.price || 0
                    },
                    quantity: item.quantity || 0,
                    price: item.price || 0
                })),
                total: order.total || 0,
                status: order.status || 'pending',
                date: order.date || new Date()
            }));
        } catch (error) {
            console.error('Error in selectByQueryWithPagination:', error);
            throw error;
        }
    }

    static async count(query) {
        try {
            return await Models.Order.countDocuments(query);
        } catch (error) {
            console.error('Error in count:', error);
            throw error;
        }
    }

    // Trong phương thức selectById, thêm xử lý date
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

            if (!order) return null;

            // Calculate total if not present
            if (!order.total) {
                order.total = order.items.reduce((sum, item) => {
                    const quantity = Number(item.quantity || 0);
                    const price = Number(item.price || (item.product && item.product.price) || 0);
                    return sum + (quantity * price);
                }, 0);
            }

            return {
                _id: order._id?.toString(),
                customer: {
                    name: order.customer?.name || 'Khách vãng lai',
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
                        price: item.price || item.product?.price || 0
                    },
                    quantity: item.quantity || 0,
                    price: item.price || item.product?.price || 0
                })),
                total: order.total,
                status: order.status || 'pending',
                date: order.date || new Date(),
                paymentMethod: order.paymentMethod || 'cash'  // Đảm bảo trả về phương thức thanh toán
            };
        } catch (error) {
            console.error('Error in selectById:', error);
            throw error;
        }
    }
    // Thêm phương thức update vào class OrderDAO
    static async update(id, updateData) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID đơn hàng không hợp lệ');
            }

            const result = await Models.Order.findByIdAndUpdate(
                id,
                { $set: updateData },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!result) {
                throw new Error('Đơn hàng không tồn tại');
            }

            return result;
        } catch (error) {
            console.error('Error in OrderDAO.update:', error);
            throw error;
        }
    }

    static async updateStatus(id, status) {
        try {
            console.log(`===== UPDATING ORDER STATUS =====`);
            console.log(`Order ID: ${id}`);
            console.log(`New status: ${status}`);

            // Get the order without populating fields first
            const order = await Models.Order.findById(id);
            if (!order) {
                throw new Error(`Không tìm thấy đơn hàng với ID: ${id}`);
            }

            const oldStatus = order.status;
            console.log(`Previous status: ${oldStatus}`);

            // Skip processing if status hasn't changed
            if (oldStatus === status) {
                console.log(`Order status unchanged (${status}). Skipping processing.`);
                return order;
            }

            // Update the status
            order.status = status;
            await order.save();

            // Process customer total spent update if needed
            if ((status === 'delivered' && oldStatus !== 'delivered') ||
                (status !== 'delivered' && oldStatus === 'delivered')) {

                try {
                    // Get customer information
                    let customerInfo = order.customer;

                    // If it's a string but not a valid ObjectId, it might be a stringified object
                    if (typeof customerInfo === 'string' && !mongoose.Types.ObjectId.isValid(customerInfo)) {
                        try {
                            // Try to parse it as JSON
                            customerInfo = JSON.parse(customerInfo);
                        } catch (e) {
                            // If parsing fails, leave it as is
                            console.log('Failed to parse customer info as JSON');
                        }
                    }

                    console.log('Customer info:', customerInfo);

                    let customer = null;

                    // Try different ways to find the customer
                    if (typeof customerInfo === 'object') {
                        if (customerInfo.email) {
                            // Try to find customer by email
                            customer = await Models.Customer.findOne({ email: customerInfo.email });
                            console.log(`Looking up customer by email: ${customerInfo.email}`);
                        }

                        if (!customer && customerInfo.phone) {
                            // Try to find customer by phone
                            customer = await Models.Customer.findOne({ phone: customerInfo.phone });
                            console.log(`Looking up customer by phone: ${customerInfo.phone}`);
                        }
                    } else if (mongoose.Types.ObjectId.isValid(customerInfo)) {
                        // If it's a valid ObjectId, try to find by ID
                        customer = await Models.Customer.findById(customerInfo);
                        console.log(`Looking up customer by ID: ${customerInfo}`);
                    }

                    if (!customer) {
                        console.log('Customer not found. Skipping total spent update.');
                        return order;
                    }

                    console.log(`Found customer: ${customer._id}, ${customer.name}`);

                    // Calculate order total from items
                    const orderTotal = order.items.reduce((total, item) => {
                        return total + (item.price * item.quantity);
                    }, 0);

                    console.log(`Order total: ${orderTotal}`);

                    // Update total spent directly without using CustomerDAO
                    if (status === 'delivered' && oldStatus !== 'delivered') {
                        // Add to total spent when changing to delivered
                        console.log(`Adding ${orderTotal} to customer total spent`);
                        if (typeof customer.totalSpent !== 'number') {
                            customer.totalSpent = 0;
                        }
                        customer.totalSpent += orderTotal;
                        await customer.save();
                        console.log(`Customer total spent updated to: ${customer.totalSpent}`);
                    } else if (status !== 'delivered' && oldStatus === 'delivered') {
                        // Subtract from total spent when changing from delivered
                        console.log(`Subtracting ${orderTotal} from customer total spent`);
                        if (typeof customer.totalSpent !== 'number') {
                            customer.totalSpent = 0;
                        } else {
                            customer.totalSpent -= orderTotal;
                            if (customer.totalSpent < 0) {
                                customer.totalSpent = 0;
                            }
                        }
                        await customer.save();
                        console.log(`Customer total spent updated to: ${customer.totalSpent}`);
                    }
                } catch (customerError) {
                    console.error(`Error updating customer total spent:`, customerError);
                    // Continue with order update even if customer update fails
                }
            }

            return order;
        } catch (error) {
            console.error('Error in OrderDAO.updateStatus:', error);
            throw error;
        }
    }

    static async getTopProducts(limit = 5) {
        try {
            return await Models.Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.product",
                        count: { $sum: "$items.quantity" }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                {
                    $project: {
                        _id: {
                            name: "$product.name",
                            id: "$product._id"
                        },
                        count: 1
                    }
                },
                { $sort: { count: -1 } },
                { $limit: limit }
            ]);
        } catch (error) {
            console.error('Error in getTopProducts:', error);
            throw error;
        }
    }

    static async selectRecent(limit = 10) {
        try {
            const orders = await Models.Order.find()
                .sort({ date: -1 })
                .limit(limit)
                .populate('customer', 'name')
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order?._id?.toString() || '',
                customer: {
                    name: order.customer?.name || 'Unknown Customer'
                },
                status: order.status || 'pending',
                date: order.date || new Date(),
                paymentMethod: order.paymentMethod || 'cash',
                total: order.total || 0
            }));
        } catch (error) {
            console.error('Error in selectRecent:', error);
            throw error;
        }
    }

    static async selectAllVerified() {
        try {
            const orders = await Models.Order
                .find({})
                .populate({
                    path: 'customer',
                    select: 'username _id'
                })
                .populate({
                    path: 'items.product',
                    select: 'name price _id'
                })
                .sort({ date: -1 })
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
                    _id: order?._id?.toString() || '',
                    customer: {
                        _id: order.customer?._id?.toString() || '',
                        username: order.customer?.username || ''
                    },
                    items: order.items.map(item => ({
                        product: {
                            _id: item.product?._id?.toString() || '',
                            name: item.product?.name || '',
                            price: item.product?.price || 0
                        },
                        quantity: item.quantity || 0,
                        price: item.price || 0
                    })),
                    total: order.total || 0,
                    status: order.status || 'pending',
                    date: order.date || new Date()
                }));
        } catch (error) {
            console.error('Error in selectAllVerified:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            return await Models.Order.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error in OrderDAO.delete:', error);
            throw error;
        }
    }

    static async selectByStatus(status) {
        try {
            const orders = await Models.Order.find({ status: status })
                .populate('customer')
                .populate({
                    path: 'items.product',
                    select: 'name image price'
                })
                .lean()
                .exec();

            return orders.map(order => ({
                _id: order._id.toString(),
                customer: order.customer ? {
                    _id: order.customer._id.toString(),
                    name: order.customer.name || '',
                    phone: order.customer.phone || '',
                    email: order.customer.email || '',
                    address: order.customer.address || ''
                } : null,
                items: order.items.map(item => ({
                    product: {
                        _id: item.product?._id.toString() || '',
                        name: item.product?.name || 'Sản phẩm không còn tồn tại',
                        image: item.product?.image || '',
                        price: item.price || 0
                    },
                    quantity: item.quantity || 0,
                    price: item.price || 0
                })),
                total: order.total || 0,
                status: order.status,
                date: order.date || new Date()
            }));
        } catch (error) {
            console.error('Error in selectByStatus:', error);
            throw error;
        }
    }
    // Add this function to the OrderDAO class

    static async getRevenueByDate(startDate, endDate) {
        try {
            // Convert string dates to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Set end of day for the end date
            end.setHours(23, 59, 59, 999);

            // Find orders within date range
            const orders = await Models.Order.find({
                date: {
                    $gte: start,
                    $lte: end
                }
            }).lean();

            // Group revenue by date
            const revenueByDate = {};

            orders.forEach(order => {
                // Format date as local string (e.g., "dd/mm/yyyy")
                const dateObj = new Date(order.date);
                const dateStr = dateObj.toLocaleDateString('vi-VN');

                // Initialize or add to daily revenue
                if (!revenueByDate[dateStr]) {
                    revenueByDate[dateStr] = 0;
                }

                revenueByDate[dateStr] += order.total || 0;
            });

            // Convert to array format for API response
            const result = Object.keys(revenueByDate).map(date => ({
                date,
                revenue: revenueByDate[date]
            }));

            return result.sort((a, b) => {
                // Sort by date 
                const dateA = new Date(a.date.split('/').reverse().join('-'));
                const dateB = new Date(b.date.split('/').reverse().join('-'));
                return dateA - dateB;
            });
        } catch (error) {
            console.error('Error in getRevenueByDate:', error);
            throw new Error(`Error getting revenue data: ${error.message}`);
        }
    }

    // Also add these other missing methods that are likely being called:
    static async getOrderStatsByStatus(startDate, endDate) {
        try {
            // Convert string dates to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Find orders within date range
            const orders = await Models.Order.find({
                date: {
                    $gte: start,
                    $lte: end
                }
            }).lean();

            // Count orders by status
            const orderStats = {
                pending: 0,
                processing: 0,
                shipping: 0,
                delivered: 0,
                cancelled: 0,
                total: orders.length
            };

            orders.forEach(order => {
                if (orderStats.hasOwnProperty(order.status)) {
                    orderStats[order.status]++;
                }
            });

            return orderStats;
        } catch (error) {
            console.error('Error in getOrderStatsByStatus:', error);
            throw new Error(`Error getting order statistics: ${error.message}`);
        }
    }

    static async getGeneralStats(startDate, endDate) {
        try {
            // Convert string dates to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // Find orders within date range
            const orders = await Models.Order.find({
                date: {
                    $gte: start,
                    $lte: end
                }
            }).populate('customer').lean();

            // Calculate total revenue
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

            // Get unique customer count - fixed to properly count customers
            const uniqueCustomers = new Set();
            orders.forEach(order => {
                if (order.customer && order.customer._id) {
                    uniqueCustomers.add(order.customer._id.toString());
                }
            });

            const totalCustomers = uniqueCustomers.size;

            // Calculate average order value
            const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

            return {
                totalRevenue,
                totalOrders: orders.length,
                totalCustomers, // Now correctly counts unique customers
                avgOrderValue
            };
        } catch (error) {
            console.error('Error in getGeneralStats:', error);
            throw new Error(`Error getting general statistics: ${error.message}`);
        }
    }

    // Add this method to the OrderDAO class if it doesn't exist
    static async selectByCustomerId(customerId) {
        try {
            console.log('Searching orders for customer:', customerId);

            const orders = await Models.Order
                .find({
                    $or: [
                        { 'customer._id': customerId },
                        { 'customer': customerId }
                    ]
                })
                .sort({ date: -1 })
                .populate('items.product')
                .lean();

            console.log(`Found ${orders.length} orders`);

            return orders;
        } catch (error) {
            console.error('Error in selectByCustomerId:', error);
            throw error;
        }
    }
}
module.exports = OrderDAO;

