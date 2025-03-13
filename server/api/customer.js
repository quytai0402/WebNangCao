// Nhập các mô-đun cần thiết
const axios = require('axios');
const CustomerDAO = require('../models/CustomerDAO');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Models = require('../models/Models');
const JwtUtil = require('../utils/JwtUtil');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const EmailUtil = require('../utils/EmailUtil');
const OrderDAO = require('../models/OrderDAO');
// Nhập DAO cho danh mục và sản phẩm
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO = require('../models/ProductDAO');

// Cấu hình transporter để gửi email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tranquytai0402@gmail.com',
    pass: 'yrti ipes lkwx bwgx'
  }
});

// Ghi log thông báo đăng ký route
console.log('Đăng ký routes cho /api/customer');

// Route để lấy tất cả danh mục
router.get('/categories', async function (req, res) {
  try {
    console.log('Xử lý request GET /categories');
    const categories = await CategoryDAO.selectAll(); // Lấy tất cả danh mục
    res.json(categories);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách danh mục' });
  }
});

// Route để lấy danh mục theo ID
router.get('/categories/:id', async function (req, res) {
  try {
    const categoryId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'ID danh mục không hợp lệ' });
    }
    const category = await CategoryDAO.selectById(categoryId); // Lấy danh mục theo ID
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    }
    res.json(category);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục theo ID:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin danh mục' });
  }
});

// ROUTES CHO SẢN PHẨM - Thứ tự quan trọng!
// 1. Route để lấy sản phẩm mới
router.get('/products/new', async function (req, res) {
  try {
    // Tăng limit mặc định lên 100 khi hiển thị tất cả
    const limit = parseInt(req.query.limit) || 100;
    const products = await ProductDAO.selectTopNew(limit); // Lấy những sản phẩm mới nhất
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm mới:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy sản phẩm mới',
      error: error.message
    });
  }
});

// 2. Route để lấy sản phẩm hot
router.get('/products/hot', async function (req, res) {
  try {
    console.log('Hot products API được gọi');
    const limit = parseInt(req.query.limit) || 8;

    // Kiểm tra xem có đơn hàng nào không
    const orderCount = await Models.Order.countDocuments({
      status: { $in: ['COMPLETED', 'APPROVED'] }
    });
    console.log(`Tìm thấy ${orderCount} đơn hàng đủ điều kiện`);

    const products = await ProductDAO.selectTopHot(limit); // Lấy những sản phẩm hot
    console.log(`Tìm thấy ${products.length} sản phẩm hot`);

    res.json(products.length ? products : []); // Trả về mảng rỗng nếu không tìm thấy sản phẩm
  } catch (error) {
    console.error('Lỗi trong route sản phẩm hot:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy sản phẩm bán chạy',
      error: error.message
    });
  }
});

// 3. Route để tìm kiếm sản phẩm theo từ khóa
router.get('/products/search/:keyword', async function (req, res) {
  try {
    console.log('Xử lý request GET /products/search/:keyword');
    const keyword = req.params.keyword;
    const products = await ProductDAO.selectByKeyword(keyword); // Tìm sản phẩm theo từ khóa
    console.log(`Tìm thấy ${products.length} sản phẩm với từ khóa "${keyword}"`);
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm kiếm sản phẩm',
      error: error.message
    });
  }
});

// 4. Route để lấy sản phẩm theo danh mục
router.get('/products/category/:id', async function (req, res) {
  try {
    const categoryId = req.params.id;
    console.log('Xử lý request GET /products/category/:id với ID =', categoryId);

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'ID danh mục không hợp lệ' });
    }

    const products = await ProductDAO.selectByCategory(categoryId); // Lấy sản phẩm thuộc danh mục
    console.log(`Tìm thấy ${products.length} sản phẩm cho danh mục ${categoryId}`);
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
    res.status(500).json({ error: 'Không thể lấy sản phẩm theo danh mục' });
  }
});

// 5. Route để lấy tất cả sản phẩm
router.get('/products', async function (req, res) {
  try {
    console.log('Xử lý request GET /products');
    const products = await ProductDAO.selectAll(); // Lấy tất cả sản phẩm
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách sản phẩm' });
  }
});

// 6. Route để lấy một sản phẩm theo ID
router.get('/products/:id', async function (req, res) {
  try {
    console.log('Xử lý request GET /products/:id với ID =', req.params['id']);

    const product = await Models.Product.findById(req.params['id'])
      .populate('category', 'name')
      .lean();

    if (!product) {
      return res.json(null); // Nếu không tìm thấy sản phẩm
    }

    res.json(product);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route tìm kiếm thêm theo tham số truy vấn
router.get('/products/search', async function (req, res) {
  try {
    console.log('Xử lý request GET /products/search with query parameter');
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ khóa tìm kiếm'
      });
    }

    const products = await ProductDAO.selectByKeyword(keyword); // Tìm sản phẩm theo từ khóa
    console.log(`Tìm thấy ${products.length} sản phẩm với từ khóa "${keyword}"`);
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm kiếm sản phẩm',
      error: error.message
    });
  }
});

// Route đăng ký tài khoản
router.post('/register', async function (req, res) {
  try {
    const { username, password, name, phone, email } = req.body;

    // Kiểm tra username và email tồn tại
    const existingUser = await CustomerDAO.selectByUsernameOrEmail(username);
    if (existingUser) {
      return res.json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }

    const existingEmail = await CustomerDAO.selectByUsernameOrEmail(email);
    if (existingEmail) {
      return res.json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo token kích hoạt
    const activationToken = crypto.randomBytes(20).toString('hex');
    const activationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const hashedPassword = CustomerDAO.hashPassword(password); // Mã hóa mật khẩu

    // Tạo khách hàng mới
    const newCustomer = {
      username,
      password: hashedPassword,
      name,
      phone,
      email,
      status: 'inactive',
      active: false,
      activationToken,
      activationExpires,
      isRegistered: true
    };

    const customer = await CustomerDAO.insert(newCustomer); // Thêm khách hàng vào DB

    // Gửi email kích hoạt
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
    const activationUrl = `${process.env.CLIENT_URL}/activate?token=${activationToken}&id=${customer._id}`;
    await EmailUtil.sendActivationEmail(email, name || username, activationUrl); // Gửi email kích hoạt

    res.json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.'
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
});

// API đăng nhập
router.post('/login', async function (req, res) {
  try {
    const { username, password } = req.body;
    const customer = await CustomerDAO.selectByUsernameOrEmail(username); // Lấy khách hàng theo username hoặc email

    if (!customer) {
      return res.json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
      });
    }
    if (!customer.active) {
      return res.json({
        success: false,
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản.'
      });
    }

    // Kiểm tra mật khẩu
    if (!CustomerDAO.verifyPassword(password, customer.password)) {
      return res.json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác'
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (customer.status === 'inactive') {
      return res.json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.'
      });
    }

    // Tạo token và trả về thông tin đăng nhập
    const token = JwtUtil.genToken(customer);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      customer: customer
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
});

// Route kiểm tra token
router.get('/validate-token', async function (req, res) {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      return res.json({ valid: false });
    }

    // Xác thực token với cách tiếp cận linh hoạt hơn
    try {
      const decoded = JwtUtil.verifyToken(token);
      // Kiểm tra nếu người dùng tồn tại
      const customer = await Models.Customer.findOne({ username: decoded.username });
      if (!customer) {
        return res.json({ valid: false });
      }
      return res.json({ valid: true });
    } catch (tokenError) {
      // Chỉ coi các token không hợp lệ hoàn toàn là không hợp lệ
      if (tokenError.name === 'JsonWebTokenError') {
        return res.json({ valid: false });
      }
      // Nếu chỉ hết hạn nhưng vẫn hợp lệ, vẫn coi là hợp lệ và để cơ chế làm mới xử lý
      return res.json({ valid: true, needsRefresh: true });
    }
  } catch (error) {
    console.error('Lỗi kiểm tra token:', error);
    res.json({ valid: true }); // Mặc định là hợp lệ để tránh bị đăng xuất không cần thiết
  }
});

// Route kích hoạt tài khoản
router.post('/activate', async function (req, res) {
  try {
    const { token, id } = req.body;

    // Kiểm tra nếu token và id được cung cấp
    if (!token || !id) {
      return res.json({
        success: false,
        message: 'Token hoặc ID không hợp lệ'
      });
    }

    // Tìm khách hàng theo ID
    const customer = await CustomerDAO.selectById(id);

    if (!customer) {
      return res.json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Kiểm tra nếu tài khoản đã được kích hoạt
    if (customer.active) {
      return res.json({
        success: true,
        message: 'Tài khoản đã được kích hoạt trước đó'
      });
    }

    // Xác minh token kích hoạt
    if (customer.activationToken !== token) {
      return res.json({
        success: false,
        message: 'Token kích hoạt không hợp lệ'
      });
    }

    // Kiểm tra nếu token đã hết hạn
    if (customer.activationExpires < Date.now()) {
      return res.json({
        success: false,
        message: 'Link kích hoạt đã hết hạn'
      });
    }

    // Kích hoạt tài khoản
    await CustomerDAO.activateAccount(id);

    res.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công!'
    });
  } catch (error) {
    console.error('Lỗi khi kích hoạt tài khoản:', error);
    res.json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi kích hoạt tài khoản'
    });
  }
});

// Route thanh toán
router.post('/checkout', async function (req, res) {
  try {
    const orderData = req.body;
    let customerObj = null;

    if (orderData.customerInfo) {
      // Trường hợp khách hàng đã đăng nhập (có customer ID)
      if (orderData.customer) {
        customerObj = await CustomerDAO.selectById(orderData.customer);
      }
      // Trường hợp khách vãng lai
      else {
        // Kiểm tra khách hàng đã tồn tại trong hệ thống chưa dựa vào email hoặc số điện thoại
        let existingCustomer = null;

        if (orderData.customerInfo.email) {
          existingCustomer = await CustomerDAO.selectByEmail(orderData.customerInfo.email);
        }

        if (!existingCustomer && orderData.customerInfo.phone) {
          existingCustomer = await CustomerDAO.selectByPhone(orderData.customerInfo.phone);
        }

        // Nếu khách hàng đã tồn tại, cập nhật thông tin mới
        if (existingCustomer) {
          customerObj = existingCustomer;

          // Cập nhật thông tin nếu cần
          const updateData = {
            name: orderData.customerInfo.name || existingCustomer.name,
            address: orderData.customerInfo.address || existingCustomer.address,
            phone: orderData.customerInfo.phone || existingCustomer.phone
          };

          // Chỉ cập nhật khi có thay đổi
          if (JSON.stringify(updateData) !== JSON.stringify({
            name: existingCustomer.name,
            address: existingCustomer.address,
            phone: existingCustomer.phone
          })) {
            await CustomerDAO.update(existingCustomer._id, updateData);
          }
        }
        // Nếu khách hàng chưa tồn tại, tạo mới
        else {
          const guestCustomer = {
            name: orderData.customerInfo.name,
            email: orderData.customerInfo.email,
            phone: orderData.customerInfo.phone,
            address: orderData.customerInfo.address,
            status: 'active',
            active: true,
            isRegistered: false
          };

          try {
            customerObj = await CustomerDAO.insert(guestCustomer);
          } catch (error) {
            console.error('Lỗi khi tạo khách hàng vãng lai:', error);
            return res.json({
              success: false,
              message: 'Không thể tạo thông tin khách hàng. Vui lòng thử lại.'
            });
          }
        }
      }
    }

    // Tiếp tục với việc tạo đơn hàng như cũ
    // Chuẩn bị dữ liệu cho đơn hàng...
    const newOrderData = {
      customer: {
        _id: customerObj ? customerObj._id : null,
        name: orderData.customerInfo.name,
        phone: orderData.customerInfo.phone,
        email: orderData.customerInfo.email || '',
        address: orderData.customerInfo.address,
        isRegistered: customerObj ? !!customerObj.username : false,
        type: customerObj && customerObj.isRegistered ? 'registered' : 'guest'
      },
      items: orderData.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      total: orderData.total,
      status: 'pending',
      date: new Date(),
      paymentMethod: orderData.paymentMethod || 'cash',
      giftWrap: orderData.giftWrap || false,
      giftMessage: orderData.giftMessage || '',
      note: orderData.note || ''
    };

    // Tạo đơn hàng
    const order = await OrderDAO.insert(newOrderData);

    // Cập nhật tổng số đơn hàng cho khách hàng nếu có
    if (customerObj && customerObj._id) {
      await CustomerDAO.incrementOrderCount(customerObj._id);
    }

    // Gửi email xác nhận nếu khách hàng cung cấp email
    if (orderData.customerInfo.email) {
      try {
        // Chuẩn bị các mặt hàng của đơn hàng với thông tin chi tiết hơn cho email
        const orderItems = await Promise.all(orderData.items.map(async (item) => {
          try {
            const product = await Models.Product.findById(item.product).lean();
            return {
              product: {
                _id: product?._id?.toString() || 'unknown',
                name: product?.name || 'Sản phẩm không xác định',
                image: product?.image || ''
              },
              quantity: item.quantity,
              price: item.price
            };
          } catch (err) {
            console.error('Lỗi khi lấy thông tin sản phẩm cho email:', err);
            return {
              product: {
                name: 'Sản phẩm không xác định',
                _id: 'unknown'
              },
              quantity: item.quantity,
              price: item.price
            };
          }
        }));

        // Định dạng đơn hàng cho email
        const orderForEmail = {
          _id: order._id.toString(),
          date: order.date,
          customerInfo: orderData.customerInfo,
          items: orderItems,
          paymentMethod: orderData.paymentMethod || 'cash'
        };

        console.log('Gửi email xác nhận với cấu trúc dữ liệu:', {
          orderId: orderForEmail._id,
          customerEmail: orderForEmail.customerInfo.email,
          itemCount: orderForEmail.items.length
        });

        // Gửi email xác nhận
        const emailResult = await EmailUtil.sendOrderConfirmationEmail(orderForEmail);

        if (emailResult.success) {
          console.log(`Email xác nhận đã được gửi thành công đến ${orderData.customerInfo.email}`);
        } else {
          console.error('Gửi email xác nhận thất bại:', emailResult.error);
          // Thêm lỗi email vào phản hồi để gỡ lỗi
          res.locals.emailError = emailResult.error;
        }
      } catch (emailError) {
        console.error('Lỗi trong quá trình xác nhận email:', emailError);
        res.locals.emailError = emailError.message;
        // Tiếp tục với quy trình đặt hàng ngay cả khi email thất bại
      }
    }

    res.json({
      success: true,
      message: 'Đặt hàng thành công',
      order: order,
      orderNumber: order._id
    });
  } catch (error) {
    console.error('Lỗi trong quá trình thanh toán:', error);
    res.json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi xử lý đơn hàng'
    });
  }
});

// Route sửa lại lấy đơn hàng của khách hàng
router.get('/orders', JwtUtil.checkToken, async function (req, res) {
  try {
    // Lấy thông tin khách hàng từ token
    const customerId = req.decoded.id;
    const username = req.decoded.username;

    if (!customerId && !username) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Tìm khách hàng
    const customer = await CustomerDAO.selectById(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thông tin khách hàng'
      });
    }

    // Tìm đơn hàng theo nhiều tiêu chí
    const queries = [];

    // 1. Tìm theo ID 
    queries.push(Models.Order.find({ 'customer._id': customer._id }));

    // 2. Tìm theo số điện thoại
    if (customer.phone) {
      queries.push(Models.Order.find({ 'customer.phone': customer.phone }));
    }

    // 3. Tìm theo email
    if (customer.email) {
      queries.push(Models.Order.find({ 'customer.email': customer.email }));
    }

    // Thực hiện tất cả các truy vấn
    const results = await Promise.all(queries);

    // Gộp kết quả và loại bỏ trùng lặp
    const uniqueOrderIds = new Set();
    const orders = [];

    for (const result of results) {
      for (const order of result) {
        if (!uniqueOrderIds.has(order._id.toString())) {
          uniqueOrderIds.add(order._id.toString());
          orders.push(order);
        }
      }
    }

    // Sắp xếp đơn hàng theo ngày giảm dần
    const sortedOrders = orders.sort((a, b) =>
      new Date(b.date || Date.now()) - new Date(a.date || Date.now())
    );

    res.json({
      success: true,
      orders: sortedOrders
    });

  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng của khách hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi truy xuất đơn hàng'
    });
  }
});

// Route lấy đơn hàng của khách hàng theo ID
router.get('/orders/:customerId', JwtUtil.checkToken, async function (req, res) {
  try {
    const customerId = req.params.customerId;
    console.log('Lấy đơn hàng cho khách hàng:', customerId);

    if (!customerId) {
      return res.json({
        success: false,
        message: 'ID khách hàng không hợp lệ'
      });
    }

    // Tìm khách hàng
    const customer = await Models.Customer.findById(customerId);
    if (!customer) {
      return res.json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Tạo query tìm kiếm đơn hàng
    const query = {
      $or: [
        { 'customer._id': customerId },
        { 'customer': customerId },
        { 'customer.phone': customer.phone },
        { 'customer.email': customer.email }
      ]
    };

    // Lấy đơn hàng từ database
    const orders = await Models.Order.find(query)
      .populate('items.product')
      .sort({ date: -1 })
      .lean();

    console.log(`Tìm thấy ${orders.length} đơn hàng cho khách hàng ${customerId}`);

    res.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id,
        date: order.date,
        status: order.status,
        customerInfo: order.customer,
        items: order.items.map(item => ({
          product: {
            _id: item.product._id,
            name: item.product.name,
            image: item.product.image,
            price: item.price
          },
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        paymentMethod: order.paymentMethod
      }))
    });

  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng:', error);
    res.json({
      success: false,
      message: error.message || 'Không thể tải đơn hàng'
    });
  }
});

// Route làm mới token
router.post('/refresh-token', JwtUtil.checkToken, async function (req, res) {
  try {
    // Lấy thông tin người dùng hiện tại từ token
    const username = req.decoded.username;
    if (!username) {
      return res.json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Tạo token mới
    const customer = await CustomerDAO.findByUsername(username);
    if (!customer) {
      return res.json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Tạo một token mới với thời gian hết hạn được cập nhật
    const token = JwtUtil.genToken(customer);

    res.json({
      success: true,
      message: 'Làm mới token thành công',
      token: token
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
});

// Route cập nhật hồ sơ
router.put('/update-profile', JwtUtil.checkToken, async function (req, res) {
  try {
    // Lấy ID khách hàng trực tiếp từ token đã giải mã
    const customerId = req.jwtDecoded._id;

    // Ghi log để kiểm tra dữ liệu token
    console.log('Token đã giải mã:', req.jwtDecoded);

    if (!customerId) {
      return res.json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong token'
      });
    }

    const { name, phone, email, address } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !phone || !email) {
      return res.json({
        success: false,
        message: 'Họ tên, số điện thoại và email là bắt buộc'
      });
    }

    // Kiểm tra định dạng email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra định dạng số điện thoại
    const phonePattern = /^\d{10,11}$/;
    if (!phonePattern.test(phone)) {
      return res.json({
        success: false,
        message: 'Số điện thoại phải có 10-11 chữ số'
      });
    }

    // Cập nhật hồ sơ khách hàng
    // Từ file /server/api/customer.js (dòng khoảng 789)
    // Kiểm tra phương thức cập nhật hồ sơ để đảm bảo trả về khách hàng đã cập nhật đầy đủ
    const updatedCustomer = await CustomerDAO.update(customerId, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address ? address.trim() : ''
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ:', error);
    res.json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin'
    });
  }
});
router.get('/provinces', async function (req, res) {
  try {
    const response = await axios.get('https://provinces.open-api.vn/api/');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces data' });
  }
});
router.get('/provinces/:provinceCode', async function (req, res) {
  try {
    const { provinceCode } = req.params;
    const { depth } = req.query;
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}${depth ? `?depth=${depth}` : ''}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching province details:', error);
    res.status(500).json({ error: 'Failed to fetch province details' });
  }
});

// Proxy route for ward data by district code 
router.get('/districts/:districtCode', async function (req, res) {
  try {
    const { districtCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching district details:', error);
    res.status(500).json({ error: 'Failed to fetch district details' });
  }
});



// API yêu cầu đặt lại mật khẩu
router.post('/request-password-reset', async function (req, res) {
  try {
    const { email } = req.body;

    // Tìm kiếm khách hàng theo email
    const customer = await CustomerDAO.selectByEmail(email);
    if (!customer) {
      return res.json({
        success: false,
        message: 'Email này không tồn tại trong hệ thống của chúng tôi'
      });
    }

    // Tạo token đặt lại mật khẩu ngẫu nhiên
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 giờ

    // Cập nhật thông tin đặt lại mật khẩu cho khách hàng
    await CustomerDAO.updateDocument(customer._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    // Gửi email đặt lại mật khẩu
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
    const resetUrl = `${clientBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await EmailUtil.sendResetPasswordEmail(email, customer.name || customer.username, resetUrl);

    res.json({
      success: true,
      message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi'
    });
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu đặt lại mật khẩu:', error);
    res.json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu đặt lại mật khẩu'
    });
  }
});

// API xác thực token đặt lại mật khẩu
// Cập nhật API kiểm tra token đặt lại mật khẩu
router.post('/verify-reset-token', async function (req, res) {
  try {
    const { email, token } = req.body;

    // Kiểm tra token có tồn tại và còn hiệu lực
    const customer = await Models.Customer.findOne({
      email: email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!customer || !customer.resetPasswordToken) {
      return res.json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Lỗi khi xác thực token đặt lại mật khẩu:', error);
    res.json({ valid: false });
  }
});
// API đặt lại mật khẩu
// Cập nhật API đặt lại mật khẩu
router.post('/reset-password', async function (req, res) {
  try {
    const { email, token, newPassword } = req.body;

    // Tìm kiếm khách hàng theo email và token hợp lệ
    const customer = await Models.Customer.findOne({
      email: email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!customer) {
      return res.json({
        success: false,
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = CustomerDAO.hashPassword(newPassword);
    
    // Cập nhật mật khẩu và vô hiệu hóa token đặt lại
    await Models.Customer.findByIdAndUpdate(customer._id, {
      password: hashedPassword,
      resetPasswordToken: null,  // Xóa token khi đã sử dụng
      resetPasswordExpires: null // Xóa thời hạn token
    });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu'
    });
  }
});
// Add this route after your other customer routes

// Route đổi mật khẩu
router.put('/change-password', JwtUtil.checkToken, async function (req, res) {
  try {
    const customerId = req.jwtDecoded._id;
    
    if (!customerId) {
      return res.json({
        success: false,
        message: 'Không tìm thấy ID người dùng trong token'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.json({
        success: false,
        message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
      });
    }

    // Find customer
    const customer = await CustomerDAO.selectById(customerId);
    if (!customer) {
      return res.json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Verify current password
    if (!CustomerDAO.verifyPassword(currentPassword, customer.password)) {
      return res.json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Hash new password
    const hashedPassword = CustomerDAO.hashPassword(newPassword);
    
    // Update password
    await CustomerDAO.updatePassword(customerId, hashedPassword);

    res.json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi thay đổi mật khẩu'
    });
  }
});

router.get('/wishlist', JwtUtil.checkToken, async function (req, res) {
  try {
    const customerId = req.user._id;
    const wishlist = await WishlistDAO.getWishlist(customerId);
    
    res.json({
      success: true,
      products: wishlist.products
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu thích:', error);
    res.json({
      success: false, 
      message: 'Có lỗi xảy ra khi lấy danh sách yêu thích'
    });
  }
});

// API xóa sản phẩm khỏi danh sách yêu thích
router.delete('/wishlist/remove/:productId', JwtUtil.checkToken, async function (req, res) {
  try {
    const customerId = req.user._id;
    const { productId } = req.params;
    
    await WishlistDAO.removeFromWishlist(customerId, productId);
    
    res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi danh sách yêu thích:', error);
    res.json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa sản phẩm khỏi danh sách yêu thích'
    });
  }
});

// API xóa toàn bộ danh sách yêu thích
router.delete('/wishlist/clear', JwtUtil.checkToken, async function (req, res) {
  try {
    const customerId = req.user._id;
    await WishlistDAO.clearWishlist(customerId);
    
    res.json({
      success: true,
      message: 'Đã xóa toàn bộ danh sách yêu thích'
    });
  } catch (error) {
    console.error('Lỗi khi xóa toàn bộ danh sách yêu thích:', error);
    res.json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa toàn bộ danh sách yêu thích'
    });
  }
});
module.exports = router;
