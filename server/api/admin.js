const upload = require('../middleware/uploadMiddleware');
const express = require('express');
const router = express.Router();
const path = require('path');
const JwtUtil = require('../utils/JwtUtil');
const AdminDAO = require('../models/AdminDAO');
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO = require('../models/ProductDAO');
const OrderDAO = require('../models/OrderDAO');
const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;
const Models = require('../models/Models');
const EmailUtil = require('../utils/EmailUtil');

const bcrypt = require('bcrypt');
// Define font paths after requiring path module
const FONT_REGULAR = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/Roboto-Bold.ttf');


// Route đăng nhập admin
router.post('/login', async function (req, res) {
    const username = req.body.username; // Tên người dùng
    const password = req.body.password; // Mật khẩu

    if (username && password) {
        const admin = await AdminDAO.selectByUsernameAndPassword(username, password);
        if (admin) {
            const token = JwtUtil.genToken(username, password);
            res.json({ success: true, message: 'Đăng nhập thành công', token: token });
        } else {
            res.json({ success: false, message: 'Tên người dùng hoặc mật khẩu không chính xác' });
        }
    } else {
        res.json({ success: false, message: 'Vui lòng nhập tên người dùng và mật khẩu' });
    }
});

// Route tạo danh mục mới
router.post('/categories', JwtUtil.checkToken, async function (req, res) {
    try {
        const name = req.body.name; // Tên danh mục

        if (!name) {
            return res.json({
                success: false,
                message: 'Tên danh mục là bắt buộc'
            });
        }

        const newCategory = await CategoryDAO.insert({ name: name });

        res.json({
            success: true,
            message: 'Danh mục đã được tạo thành công',
            category: newCategory
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Route kiểm tra tính hợp lệ của token
router.get('/token', JwtUtil.checkToken, function (req, res) {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    res.json({ success: true, message: 'Token hợp lệ', token: token });
});

// Route lấy tất cả danh mục
router.get('/categories', JwtUtil.checkToken, async function (req, res) {
    try {
        const categories = await CategoryDAO.selectAll();
        res.json({ success: true, categories: categories });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.put('/products/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const id = req.params.id;
        const { name, price, category, image } = req.body;

        // Tạo object update
        const updateData = {
            name,
            price,
            category,
            cdate: new Date()
        };

        // Nếu có image mới (base64 string)
        if (image) {
            try {
                // Upload ảnh lên Cloudinary
                const cloudinaryRes = await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${image}`,
                    { folder: 'products' }
                );
                // Lưu URL ảnh từ Cloudinary
                updateData.image = cloudinaryRes.secure_url;
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                return res.json({
                    success: false,
                    message: 'Lỗi khi upload ảnh'
                });
            }
        }

        const updatedProduct = await ProductDAO.update(id, updateData);
        if (!updatedProduct) {
            return res.json({
                success: false,
                message: 'Sản phẩm không tồn tại'
            });
        }

        await updatedProduct.populate('category');
        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            product: updatedProduct
        });
    } catch (error) {
        console.error("Lỗi cập nhật sản phẩm:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
});
// Route xóa danh mục
router.delete('/categories/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const _id = req.params.id;
        const result = await CategoryDAO.delete(_id);

        if (!result) {
            return res.json({
                success: false,
                message: 'Danh mục không tìm thấy'
            });
        }

        res.json({
            success: true,
            message: 'Danh mục đã được xóa thành công'
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.get('/products', JwtUtil.checkToken, async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on filters
        let query = {};
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.search) {
            query.name = new RegExp(req.query.search, 'i');
        }

        // Build sort options
        let sort = {};
        const sortField = req.query.sort || 'cdate';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;

        // Get total count for pagination
        const total = await ProductDAO.count(query);

        // Get products
        const products = await ProductDAO.selectByQueryWithPagination(query, sort, skip, limit);

        res.json({
            success: true,
            products: products,
            curPage: page,
            noPages: Math.ceil(total / limit),
            filters: {
                category: req.query.category || '',
                search: req.query.search || '',
                sort: req.query.sort || 'cdate',
                order: req.query.order || 'desc'
            }
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file ? req.file.path : null;
        const product = {
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            image: imageUrl // Lưu URL Cloudinary thay vì Base64
        };

        const result = await ProductDAO.insert(product);
        res.json({ success: true, product: result });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// PUT update product
router.put('/products/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const id = req.params.id;
        const product = req.body;
        const result = await ProductDAO.update(id, product);
        res.json({
            success: true,
            message: 'Product updated successfully',
            product: result
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.delete('/products/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const id = req.params.id;
        await ProductDAO.delete(id);
        res.json({
            success: true,
            message: 'Xoá sản phẩm thành công !'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route lấy danh sách đơn hàng
router.get('/orders', JwtUtil.checkToken, async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query object
        const query = {};

        // Search
        if (req.query.search) {
            query['customer.name'] = { $regex: new RegExp(req.query.search.trim(), 'i') };
        }

        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Date range
        if (req.query.startDate) {
            query.date = { ...query.date, $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            query.date = { ...query.date, $lte: new Date(req.query.endDate) };
        }

        // Sort options
        const sort = {};
        sort[req.query.sort || 'date'] = req.query.order === 'asc' ? 1 : -1;

        const [orders, total] = await Promise.all([
            OrderDAO.selectByQueryWithPagination(query, sort, skip, limit),
            OrderDAO.count(query)
        ]);

        res.json({
            success: true,
            orders,
            curPage: page,
            noPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error('Error getting orders:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.post('/orders', JwtUtil.checkToken, async function (req, res) {
    try {
        const { customer, items } = req.body;

        // Validate required fields
        if (!customer || !items || !Array.isArray(items) || items.length === 0) {
            return res.json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate items data
        for (const item of items) {
            if (!item.product || !item.quantity || item.quantity < 1) {
                return res.json({
                    success: false,
                    message: 'Invalid item information'
                });
            }
        }

        // Get full product details and calculate total
        const populatedItems = await Promise.all(items.map(async (item) => {
            const product = await Models.Product.findById(item.product).lean();
            if (!product) {
                throw new Error(`Product ${item.product} not found`);
            }
            return {
                product: item.product,
                quantity: item.quantity,
                price: product.price // Use actual price from database
            };
        }));

        // Calculate total based on actual product prices
        const total = populatedItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Process customer
        let orderCustomer;
        if (customer.phone) {
            // Check for existing customer
            orderCustomer = await CustomerDAO.selectByPhone(customer.phone);
            if (!orderCustomer) {
                // Create new customer if not exists
                orderCustomer = await CustomerDAO.insert({
                    name: customer.name || 'Khách hàng',
                    phone: customer.phone,
                    email: customer.email || '',
                    address: customer.address || '',
                    joinDate: new Date(),
                    status: 'active',
                    totalOrders: 1,
                    totalSpent: 0
                });
            } else {
                // Increment order count for existing customer
                await CustomerDAO.incrementOrderCount(orderCustomer._id);
            }
        }

        // Create order with calculated total
        const orderData = {
            customer: {
                _id: orderCustomer?._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address
            },
            items: populatedItems,
            total: total,
            status: 'pending',
            date: new Date()
        };

        const newOrder = await OrderDAO.insert(orderData);

        res.json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (error) {
        console.error('API error:', error);
        res.json({
            success: false,
            message: error.message || 'Error creating order'
        });
    }
});
router.put('/orders/:id/status', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.json({
                success: false,
                message: 'Trạng thái đơn hàng không được để trống'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.json({
                success: false,
                message: 'Trạng thái đơn hàng không hợp lệ'
            });
        }

        // Get current order
        const currentOrder = await OrderDAO.selectById(id);
        if (!currentOrder) {
            return res.json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const oldStatus = currentOrder.status;
        // Update order status
        const updatedOrder = await OrderDAO.updateStatus(id, status);

        // Send email notification if status changed and customer has email
        if (oldStatus !== status && updatedOrder.customer && updatedOrder.customer.email) {
            try {
                await EmailUtil.sendOrderStatusEmail(updatedOrder, status);
            } catch (emailError) {
                console.error('Error sending status update email:', emailError);
            }
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            order: updatedOrder
        });

    } catch (error) {
        console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
        res.json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng'
        });
    }
});

// Route xem chi tiết đơn hàng
router.get('/orders/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;
        const order = await OrderDAO.selectById(id);

        if (!order) {
            return res.json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.json({
            success: true,
            order: order
        });
    } catch (error) {
        console.error("Lỗi lấy chi tiết đơn hàng:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

router.get('/orders/:id/export', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;
        const order = await OrderDAO.selectById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Log để debug cấu trúc dữ liệu
        console.log("Order date value:", order.date);
        console.log("Order date type:", typeof order.date);

        // Initialize PDF with wider margins
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            bufferPages: true
        });

        // Register fonts
        doc.registerFont('Regular', FONT_REGULAR);
        doc.registerFont('Bold', FONT_BOLD);

        // Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=don-hang-${id}.pdf`);
        doc.pipe(res);

        // Background color
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

        // Header section
        doc.fontSize(24)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('HÓA ĐƠN BÁN HÀNG', { align: 'center' });

        // Company info
        doc.fontSize(10)
            .font('Regular')
            .fillColor('#666666')
            .text('Florista Flowers', { align: 'center' })
            .text('Địa chỉ: 69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh', { align: 'center' })
            .text('Hotline: 0972.898.369', { align: 'center' })
            .moveDown(2);

        // Divider line
        const lineY = doc.y;
        doc.strokeColor('#e0e0e0')
            .lineWidth(1)
            .moveTo(40, lineY)
            .lineTo(doc.page.width - 40, lineY)
            .stroke()
            .moveDown();

        // Order info box
        const orderInfoX = 40;
        const orderInfoY = doc.y + 10;
        const boxWidth = doc.page.width - 80;

        doc.rect(orderInfoX, orderInfoY, boxWidth, 130)
            .fillAndStroke('#f8f9fa', '#e0e0e0');

        // Format date properly - sửa lại cách xử lý ngày tháng
        let orderDate = 'N/A';
        try {
            if (order.date) {
                // Xử lý nhiều định dạng ngày tháng có thể có
                let dateObj;

                if (typeof order.date === 'object' && order.date instanceof Date) {
                    // Nếu đã là Date object
                    dateObj = order.date;
                } else if (typeof order.date === 'string') {
                    // Nếu là string
                    if (order.date.match(/^\d{4}-\d{2}-\d{2}T/)) {
                        // Định dạng ISO
                        dateObj = new Date(order.date);
                    } else if (order.date.includes('/')) {
                        // Định dạng dd/mm/yyyy
                        const parts = order.date.split('/');
                        if (parts.length >= 3) {
                            dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    } else {
                        // Thử chuyển đổi thông thường
                        dateObj = new Date(order.date);
                    }
                } else if (typeof order.date === 'number') {
                    // Nếu là timestamp
                    dateObj = new Date(order.date);
                }

                if (dateObj && !isNaN(dateObj.getTime())) {
                    orderDate = dateObj.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        } catch (e) {
            console.error('Error formatting date:', e);
            // Fallback: sử dụng ngày hiện tại nếu không thể định dạng
            orderDate = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Format status properly
        const statusMap = {
            'pending': 'Chờ xử lý',
            'processing': 'Đang xử lý',
            'shipping': 'Đang giao',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy'
        };
        const orderStatus = order.status && statusMap[order.status] ? statusMap[order.status] : 'Đang xử lý';

        // Left column - Order details
        doc.fontSize(11)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('THÔNG TIN ĐƠN HÀNG:', orderInfoX + 15, orderInfoY + 15)
            .font('Regular')
            .fontSize(10)
            .moveDown(0.5)
            .text(`Mã đơn hàng: ${order._id}`, orderInfoX + 15, doc.y)
            .moveDown(0.3)
            .text(`Ngày đặt: ${orderDate}`)
            .moveDown(0.3)
            .text(`Trạng thái: ${orderStatus}`);

        // Right column - Customer info
        doc.font('Bold')
            .fontSize(11)
            .text('THÔNG TIN KHÁCH HÀNG:', orderInfoX + boxWidth / 2, orderInfoY + 15)
            .font('Regular')
            .fontSize(10)
            .moveDown(0.5)
            .text(`Khách hàng: ${order.customer?.name || 'Khách lẻ'}`, orderInfoX + boxWidth / 2, doc.y)
            .moveDown(0.3)
            .text(`Số điện thoại: ${order.customer?.phone || 'N/A'}`)
            .moveDown(0.3)
            .text(`Địa chỉ: ${order.customer?.address || 'N/A'}`);

        // Products table
        doc.moveDown(2);
        const tableTop = doc.y + 15;
        const tableHeaders = ['STT', 'Sản phẩm', 'Đơn giá', 'Số lượng', 'Thành tiền'];
        const columnWidths = [40, 200, 85, 85, 100];
        const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        const rowHeight = 30;

        // Draw table header
        let yPos = tableTop;
        let xPos = orderInfoX;

        // Draw table header background
        doc.rect(orderInfoX, yPos, tableWidth, rowHeight).fill('#f1f1f1');

        // Draw table header text
        doc.font('Bold')
            .fontSize(10)
            .fillColor('#2c3e50');

        tableHeaders.forEach((header, index) => {
            doc.text(header, xPos + 5, yPos + 10, {
                width: columnWidths[index] - 10,
                align: index === 0 || index === 3 ? 'center' : index === 1 ? 'left' : 'right'
            });
            xPos += columnWidths[index];
        });

        // Draw table rows
        let total = 0;
        if (order.items && Array.isArray(order.items)) {
            yPos += rowHeight;

            order.items.forEach((item, index) => {
                // Row background
                doc.rect(orderInfoX, yPos, tableWidth, rowHeight)
                    .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

                xPos = orderInfoX;
                doc.font('Regular')
                    .fontSize(10)
                    .fillColor('#2c3e50');

                // STT
                doc.text((index + 1).toString(), xPos + 5, yPos + 10, {
                    width: columnWidths[0],
                    align: 'center'
                });
                xPos += columnWidths[0];

                // Product name
                const productName = item.product?.name || 'Sản phẩm không còn tồn tại';
                doc.text(productName, xPos + 5, yPos + 10, {
                    width: columnWidths[1] - 10,
                    align: 'left'
                });
                xPos += columnWidths[1];

                // Đơn giá - lấy từ item.price hoặc product.price tùy theo cấu trúc dữ liệu
                let price = 0;
                if (item.price && !isNaN(parseFloat(item.price))) {
                    price = parseFloat(item.price);
                } else if (item.product?.price && !isNaN(parseFloat(item.product.price))) {
                    price = parseFloat(item.product.price);
                }

                // Format đơn giá
                doc.text(price.toLocaleString('vi-VN') + ' đ', xPos + 5, yPos + 10, {
                    width: columnWidths[2] - 10,
                    align: 'right'
                });
                xPos += columnWidths[2];

                // Số lượng
                const quantity = parseInt(item.quantity) || 0;
                doc.text(quantity.toString(), xPos + 5, yPos + 10, {
                    width: columnWidths[3] - 10,
                    align: 'center'
                });
                xPos += columnWidths[3];

                // Thành tiền
                const itemTotal = price * quantity;
                doc.text(itemTotal.toLocaleString('vi-VN') + ' đ', xPos + 5, yPos + 10, {
                    width: columnWidths[4] - 10,
                    align: 'right'
                });

                total += itemTotal;
                yPos += rowHeight;
            });
        }

        // Sử dụng tổng tiền từ order nếu có, hoặc tính từ items
        if (order.total && !isNaN(parseFloat(order.total)) && parseFloat(order.total) > 0) {
            total = parseFloat(order.total);
        }

        yPos += 20;

        doc.font('Bold')
            .fontSize(12);

        const totalLabelWidth = 80;
        const totalValueWidth = 120;
        const totalXPos = orderInfoX + tableWidth - totalLabelWidth - totalValueWidth;

        // Total label
        doc.fillColor('#2c3e50')
            .text('Tổng tiền:', totalXPos, yPos, {
                width: totalLabelWidth,
                align: 'left'
            });

        // Total value
        doc.fillColor('#e74c3c')
            .fontSize(14)
            .text(`${total.toLocaleString('vi-VN')} đ`,
                totalXPos + totalLabelWidth, yPos, {
                width: totalValueWidth,
                align: 'left'
            });

        // Footer
        const footerY = doc.page.height - 100;

        doc.fontSize(10)
            .font('Regular')
            .fillColor('#666666')
            .text('Cảm ơn quý khách đã mua hàng!', 40, footerY, { align: 'center' })
            .moveDown(0.5)
            .text('Mọi thắc mắc xin vui lòng liên hệ Hotline: 1900.xxxx', { align: 'center' });

        // End PDF generation
        doc.end();

    } catch (error) {
        console.error("Lỗi xuất PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi tạo PDF'
            });
        }
    }
});

const CustomerDAO = require('../models/CustomerDAO');


router.get('/customers', JwtUtil.checkToken, async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query object
        const query = {};

        // Search filter
        if (req.query.search) {
            query['$or'] = [
                { name: { $regex: new RegExp(req.query.search.trim(), 'i') } },
                { phone: { $regex: new RegExp(req.query.search.trim(), 'i') } },
                { email: { $regex: new RegExp(req.query.search.trim(), 'i') } }
            ];
        }

        // Sort options
        const sort = {};
        const sortField = req.query.sortField || 'joinDate';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;

        const [customers, total] = await Promise.all([
            CustomerDAO.selectByQueryWithPagination(query, sort, skip, limit),
            CustomerDAO.count(query)
        ]);

        res.json({
            success: true,
            customers,
            curPage: page,
            noPages: Math.ceil(total / limit),
            total
        });

    } catch (error) {
        console.error('Error getting customers:', error);
        res.json({
            success: false,
            message: error.message || 'Lỗi khi tải danh sách khách hàng'
        });
    }
});

// Thêm khách hàng mới
router.post('/customers', JwtUtil.checkToken, async function (req, res) {
    try {
        // Đảm bảo trường isRegistered được thiết lập chính xác
        let customer = req.body;

        // Nếu có username và password, đánh dấu là đã đăng ký
        if (customer.username && customer.password) {
            customer.isRegistered = true;

            // Mã hóa mật khẩu nếu chưa được mã hóa
            if (!customer.password.startsWith('$2')) { // Kiểm tra nếu mật khẩu chưa được mã hóa bcrypt
                customer.password = bcrypt.hashSync(customer.password, 10);
            }
        } else {
            customer.isRegistered = false;
        }

        // Thêm khách hàng mới
        const newCustomer = await CustomerDAO.insert(customer);

        res.json({
            success: true,
            message: 'Thêm khách hàng thành công',
            customer: newCustomer
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});
router.put('/customers/:id/status/:status', JwtUtil.checkToken, async function (req, res) {
    try {
        const id = req.params.id;
        const status = req.params.status;

        // Cập nhật trạng thái
        const customer = await CustomerDAO.updateStatus(id, status);

        // Nếu trạng thái được chuyển sang "active", cũng kích hoạt tài khoản email
        if (status === 'active') {
            // Kích hoạt tài khoản email (xóa token kích hoạt và đặt active = true)
            await CustomerDAO.updateDocument(id, {
                active: true,
                activationToken: undefined,
                activationExpires: undefined
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái khách hàng thành công',
            customer: customer
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Xóa khách hàng
router.delete('/customers/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;

        // Kiểm tra ID có hợp lệ không
        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'ID khách hàng không hợp lệ'
            });
        }

        // Kiểm tra xem khách hàng có tồn tại không
        const customer = await CustomerDAO.selectById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Xóa khách hàng
        await CustomerDAO.delete(id);

        res.json({
            success: true,
            message: 'Xóa khách hàng thành công'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa khách hàng'
        });
    }
});

// Route lấy dữ liệu dashboard
router.get('/dashboard', JwtUtil.checkToken, async function (req, res) {
    try {
        // Get total products
        const products = await ProductDAO.selectAll();
        const totalProducts = products.length;

        // Get total categories
        const categories = await CategoryDAO.selectAll();
        const totalCategories = categories.length;

        // Get total customers
        const customers = await CustomerDAO.selectAll();
        const totalCustomers = customers.length;

        // Get orders
        const orders = await OrderDAO.selectAll();
        const totalOrders = orders.length;

        // Get recent orders (last 10)
        const recentOrders = orders
            .sort((a, b) => new Date(b.cdate) - new Date(a.cdate))
            .slice(0, 10)
            .map(order => ({
                id: order._id.toString(),
                customer: order.customer ? order.customer.name : 'Unknown',
                items: order.items, // Thêm dòng này
                status: order.status,
                date: order.cdate
            }));

        // Calculate top products
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product._id.toString();
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.product.name,
                        sales: 0
                    };
                }
                productSales[productId].sales += item.quantity;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        res.json({
            success: true,
            stats: {
                totalProducts,
                totalCategories,
                totalCustomers,
                totalOrders,
                recentOrders,
                topProducts
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});

// Thêm route xóa đơn hàng
router.delete('/orders/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;

        // Lấy thông tin đơn hàng trước khi xóa
        const order = await OrderDAO.selectById(id);

        if (!order) {
            return res.json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Nếu đơn hàng có liên kết với khách hàng
        if (order.customer && order.customer._id) {
            // Giảm số lượng đơn hàng của khách hàng
            await CustomerDAO.decrementOrderCount(order.customer._id);

            // Nếu đơn hàng đã giao, giảm tổng chi tiêu
            if (order.status === 'delivered') {
                const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                await CustomerDAO.updateTotalSpent(order.customer._id, -orderTotal);
            }
        }

        // Xóa đơn hàng
        await OrderDAO.delete(id);

        res.json({
            success: true,
            message: 'Xóa đơn hàng thành công'
        });
    } catch (error) {
        console.error("Lỗi xóa đơn hàng:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
});
router.put('/customers/:id/password', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.json({
                success: false,
                message: 'Mật khẩu mới là bắt buộc'
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const customer = await CustomerDAO.updatePassword(id, hashedPassword);

        if (!customer) {
            return res.json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật mật khẩu thành công'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
});
router.get('/customers/:id/orders', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.json({
                success: false,
                message: 'ID khách hàng không hợp lệ'
            });
        }

        // Tìm thông tin khách hàng
        const customer = await CustomerDAO.selectById(id);
        if (!customer) {
            return res.json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        console.log(`Found customer: ${customer.name}, email: ${customer.email}, phone: ${customer.phone}`);

        // Tạo query tìm kiếm đơn hàng theo nhiều điều kiện
        const orders = await Models.Order.find({
            $or: [
                { 'customer._id': id.toString() },
                { 'customer._id': id },
                // Thêm điều kiện tìm theo phone để tìm được các đơn hàng của khách vãng lai
                { 'customer.phone': customer.phone }
            ]
        }).sort({ date: -1 });

        console.log(`Found total ${orders.length} orders for customer ${customer.name} (ID: ${id})`);

        return res.json({
            success: true,
            orders: orders.map(order => ({
                _id: order._id.toString(),
                customer: order.customer,
                items: order.items || [],
                status: order.status || 'pending',
                date: order.date || new Date(),
                total: order.total || 0
            }))
        });
    } catch (error) {
        console.error('Error getting customer orders:', error);
        return res.json({
            success: false,
            message: error.message || 'Lỗi khi lấy đơn hàng của khách hàng'
        });
    }
});
// Add this route after your existing order routes
// Đảm bảo route này đã được định nghĩa đúng

// Route để gửi thông báo trạng thái đơn hàng
router.post('/orders/:id/send-status-notification', JwtUtil.checkToken, async function (req, res) {
    try {
        const { id } = req.params;
        const customerInfoFromClient = req.body.customerInfo;
        const currentStatus = req.body.currentStatus;

        // Lấy thông tin đơn hàng
        const order = await OrderDAO.selectById(id);

        if (!order) {
            return res.json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Ưu tiên customer từ client
        const customerInfo = customerInfoFromClient || order.customerInfo || order.customer;

        console.log("Đang gửi thông báo trạng thái:", {
            orderId: id,
            status: currentStatus,
            customerEmail: customerInfo?.email
        });

        // Kiểm tra có email không
        if (!customerInfo || !customerInfo.email) {
            return res.json({
                success: false,
                message: 'Đơn hàng này không có địa chỉ email để gửi thông báo'
            });
        }

        // Chuẩn bị dữ liệu cho email
        const orderItems = order.items.map(item => ({
            product: {
                _id: item.product._id.toString(),
                name: item.product.name || 'Sản phẩm không xác định',
                image: item.product.image || ''
            },
            quantity: item.quantity,
            price: item.price
        }));

        // Format thông tin đơn hàng cho email
        const orderForEmail = {
            _id: order._id.toString(),
            date: order.date,
            customerInfo: customerInfo,
            items: orderItems,
            paymentMethod: order.paymentMethod || 'cash',
            total: order.total,
            status: currentStatus
        };

        // Gửi email thông báo trạng thái
        const emailResult = await EmailUtil.sendOrderStatusEmail(orderForEmail);

        if (emailResult.success) {
            res.json({
                success: true,
                message: 'Email thông báo trạng thái đã được gửi thành công'
            });
        } else {
            throw new Error(emailResult.error);
        }
    } catch (error) {
        console.error("Lỗi gửi email thông báo trạng thái:", error);
        res.json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi gửi email thông báo'
        });
    }

});
// Add this route after your existing category routes

// Route cập nhật danh mục
router.put('/categories/:id', JwtUtil.checkToken, async function (req, res) {
    try {
        const id = req.params.id;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.json({
                success: false,
                message: 'Tên danh mục không được để trống'
            });
        }

        // Kiểm tra xem danh mục có tồn tại không
        const existingCategory = await CategoryDAO.selectById(id);
        if (!existingCategory) {
            return res.json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }

        // Cập nhật danh mục
        const updatedCategory = await CategoryDAO.update(id, { name: name.trim() });

        res.json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi cập nhật danh mục'
        });
    }
});
// Route API thống kê cho dashboard
router.get('/statistics', JwtUtil.checkToken, async function (req, res) {
    try {
        const { startDate, endDate } = req.query;
        
        // Chuyển đổi startDate và endDate thành Date objects
        const start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        const end = new Date(endDate || new Date());
        
        // Đảm bảo end time là cuối ngày
        end.setHours(23, 59, 59, 999);

        // Lọc đơn hàng theo khoảng thời gian
        const dateFilter = {
            date: {
                $gte: start,
                $lte: end
            }
        };

        // Lấy tất cả đơn hàng trong khoảng thời gian
        const orders = await Models.Order.find(dateFilter)
            .populate('items.product')
            .sort({ date: 1 });

        // Thống kê doanh thu theo ngày
        const revenueByDate = {};
        orders.forEach(order => {
            // Lấy ngày từ timestamp và format dưới dạng YYYY-MM-DD
            const dateStr = new Date(order.date).toLocaleDateString('vi-VN');
            
            if (!revenueByDate[dateStr]) {
                revenueByDate[dateStr] = 0;
            }
            
            revenueByDate[dateStr] += order.total || calculateOrderTotal(order.items);
        });

        // Chuyển đổi dữ liệu doanh thu thành mảng
        const revenueData = Object.keys(revenueByDate).map(date => ({
            date,
            revenue: revenueByDate[date]
        }));

        // Thống kê trạng thái đơn hàng
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

        // Tìm sản phẩm bán chạy
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!item.product || !item.product._id) return;
                
                const productId = item.product._id.toString();
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.product.name,
                        image: item.product.image || null,
                        quantity: 0,
                        revenue: 0
                    };
                }
                
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                
                productSales[productId].quantity += quantity;
                productSales[productId].revenue += quantity * price;
            });
        });

        // Chuyển đổi và sắp xếp theo doanh số
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Thống kê theo danh mục
        const categories = await CategoryDAO.selectAll();
        const productsByCategory = {};
        
        // Khởi tạo danh sách category
        categories.forEach(category => {
            productsByCategory[category._id.toString()] = {
                name: category.name,
                count: 0
            };
        });
        
        // Đếm số lượng sản phẩm đã bán theo danh mục
        const soldProducts = await Models.Product.find();
        soldProducts.forEach(product => {
            if (product.category && productsByCategory[product.category.toString()]) {
                productsByCategory[product.category.toString()].count++;
            }
        });
        
        // Chuyển đổi thành mảng và sắp xếp
        const topCategories = Object.values(productsByCategory)
            .filter(cat => cat.count > 0)
            .sort((a, b) => b.count - a.count);

        // Thống kê chung
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => 
            sum + (order.total || calculateOrderTotal(order.items)), 0);
        
        // Tổng khách hàng
        const totalCustomers = await Models.Customer.countDocuments();
        
        // Tổng sản phẩm
        const totalProducts = await Models.Product.countDocuments();
        
        // Giá trị đơn hàng trung bình
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Trả về kết quả
        res.json({
            success: true,
            revenueData,
            topProducts,
            topCategories,
            orderStats,
            generalStats: {
                totalRevenue,
                totalOrders,
                totalProducts,
                totalCustomers,
                avgOrderValue
            }
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.json({
            success: false,
            message: error.message || 'Không thể tải dữ liệu thống kê'
        });
    }
});
router.get('/statistics/export', JwtUtil.checkToken, async function (req, res) {
    try {
        const { startDate, endDate } = req.query;
        
        // Lấy dữ liệu thống kê từ database
        const revenueData = await OrderDAO.getRevenueByDate(startDate, endDate);
        const topProducts = await ProductDAO.getTopProductsByRevenue(startDate, endDate);
        const topCategories = await CategoryDAO.getTopCategories(startDate, endDate);
        const orderStats = await OrderDAO.getOrderStatsByStatus(startDate, endDate);
        const generalStats = await OrderDAO.getGeneralStats(startDate, endDate);
        
        // Tạo PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            bufferPages: true
        });

        // Đăng ký fonts
        doc.registerFont('Regular', FONT_REGULAR);
        doc.registerFont('Bold', FONT_BOLD);

        // Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=thong-ke-${startDate}-den-${endDate}.pdf`);
        doc.pipe(res);

        // Header section
        doc.fontSize(24)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('BÁO CÁO THỐNG KÊ', { align: 'center' });
            
        doc.fontSize(12)
            .font('Regular')
            .fillColor('#666666')
            .text(`Từ ngày ${startDate} đến ngày ${endDate}`, { align: 'center' })
            .moveDown(1);

        // Company info
        doc.fontSize(10)
            .font('Regular')
            .fillColor('#666666')
            .text('Florista Flowers', { align: 'center' })
            .text('Địa chỉ: 69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh', { align: 'center' })
            .text('SĐT: 0972.898.369 | Email: tranquytai0402@gmail.com', { align: 'center' })
            .moveDown(2);

        // Tổng quan
        doc.fontSize(14)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('TỔNG QUAN', { underline: true })
            .moveDown(0.5);

        // Tạo bảng tổng quan        
        const overviewData = [
            ['Tổng doanh thu', formatCurrency(generalStats.totalRevenue)],
            ['Tổng đơn hàng', orderStats.total.toString()],
            ['Tổng khách hàng', generalStats.totalCustomers.toString()],
            ['Giá trị đơn hàng trung bình', formatCurrency(generalStats.avgOrderValue)]
        ];
        
        drawTable(doc, overviewData, [200, 200]);
        doc.moveDown(2);

        // Trạng thái đơn hàng
        doc.fontSize(14)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('TRẠNG THÁI ĐƠN HÀNG', { underline: true })
            .moveDown(0.5);

        const orderStatusData = [
            ['Trạng thái', 'Số lượng'], 
            ['Chờ xử lý', orderStats.pending.toString()],
            ['Đang xử lý', orderStats.processing.toString()],
            ['Đang giao', orderStats.shipping.toString()],
            ['Đã giao', orderStats.delivered.toString()],
            ['Đã hủy', orderStats.cancelled.toString()]
        ];
        
        drawTable(doc, orderStatusData, [200, 200], true);
        doc.moveDown(2);

        // Top sản phẩm bán chạy (giới hạn 10 sản phẩm)
        doc.fontSize(14)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('TOP SẢN PHẨM BÁN CHẠY', { underline: true })
            .moveDown(0.5);

        // Check if we need to add a new page
        if (doc.y > 650) {
            doc.addPage();
        }

        const productHeaders = ['Tên sản phẩm', 'Số lượng', 'Doanh thu'];
        const productRows = topProducts.slice(0, 10).map(product => [
            product.name,
            product.quantity.toString(),
            formatCurrency(product.revenue)
        ]);
        
        drawTable(doc, [productHeaders, ...productRows], [220, 100, 140], true);
        doc.moveDown(2);

        // Check if we need to add a new page for categories
        if (doc.y > 650) {
            doc.addPage();
        }

        // Danh mục sản phẩm
        doc.fontSize(14)
            .font('Bold')
            .fillColor('#2c3e50')
            .text('PHÂN BỐ THEO DANH MỤC', { underline: true })
            .moveDown(0.5);

        const categoryHeaders = ['Tên danh mục', 'Số lượng sản phẩm'];
        const categoryRows = topCategories.slice(0, 10).map(category => [
            category.name,
            category.count.toString()
        ]);
        
        drawTable(doc, [categoryHeaders, ...categoryRows], [280, 180], true);

        // Footer
        const footerY = doc.page.height - 100;
        doc.fontSize(10)
            .font('Regular')
            .fillColor('#666666')
            .text('© Florista Flowers - Báo cáo được tạo tự động', 40, footerY, { align: 'center' });

        doc.end();
        
        function formatCurrency(amount) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(amount);
        }
        
        function drawTable(doc, data, columnWidths, hasHeader = false) {
            const tableTop = doc.y;
            let tableBottom = tableTop;
            
            // Determine row heights first
            const rowHeights = data.map(rowData => {
                let maxHeight = 20; // minimum row height
                rowData.forEach((cellData, i) => {
                    const cellWidth = columnWidths[i];
                    const cellHeight = doc.heightOfString(cellData, {
                        width: cellWidth - 10, // padding
                        align: 'left'
                    });
                    maxHeight = Math.max(maxHeight, cellHeight + 10); // padding
                });
                return maxHeight;
            });
            
            // Draw rows
            let yPos = tableTop;
            
            data.forEach((rowData, rowIndex) => {
                const rowHeight = rowHeights[rowIndex];
                let xPos = 40; // left margin
                
                // Draw row background for header
                if (hasHeader && rowIndex === 0) {
                    doc.fillColor('#f2f2f2')
                       .rect(xPos, yPos, doc.page.width - 80, rowHeight)
                       .fill();
                }
                
                // Draw cell borders and text
                rowData.forEach((cellData, colIndex) => {
                    const cellWidth = columnWidths[colIndex];
                    
                    // Draw border
                    doc.strokeColor('#cccccc')
                       .lineWidth(1)
                       .rect(xPos, yPos, cellWidth, rowHeight)
                       .stroke();
                    
                    // Draw text
                    doc.fillColor(hasHeader && rowIndex === 0 ? '#000000' : '#333333')
                       .font(hasHeader && rowIndex === 0 ? 'Bold' : 'Regular')
                       .fontSize(hasHeader && rowIndex === 0 ? 11 : 10)
                       .text(
                            cellData, 
                            xPos + 5, 
                            yPos + 5,
                            { 
                                width: cellWidth - 10,
                                align: colIndex > 0 ? 'right' : 'left',
                                lineGap: 2
                            }
                        );
                    
                    xPos += cellWidth;
                });
                
                yPos += rowHeight;
                tableBottom = yPos;
            });
            
            doc.y = tableBottom;
        }
        
    } catch (error) {
        console.error("Lỗi xuất PDF thống kê:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi tạo PDF thống kê'
            });
        }
    }
});

// Thêm hàm tính tổng đơn hàng để đảm bảo có giá trị total
function calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        return sum + (quantity * price);
    }, 0);
}

module.exports = router;