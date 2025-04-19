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
const CommentDAO = require('../models/CommentDAO');
const WishlistDAO = require('../models/WishlistDAO');

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

// Hàm tính phí vận chuyển
const calculateShippingFee = (subtotal) => {
  return 0;
};

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
    // Kiểm tra param all để quyết định số lượng sản phẩm trả về
    const limit = req.query.all === 'true' ? 100 : 10; // Tăng limit khi xem tất cả
    console.log(`Fetching new products with limit: ${limit}`);
    
    const products = await ProductDAO.selectTopNew(limit);
    
    // Đảm bảo chỉ trả về những sản phẩm hợp lệ (không null hoặc undefined)
    const validProducts = products.filter(product => product && product._id);
    
    console.log(`Tìm thấy ${validProducts.length} sản phẩm mới hợp lệ trong tổng số ${products.length}`);
    res.json(validProducts);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm mới:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy sản phẩm mới'
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

    // Lấy tham số lọc giá từ query string
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null;
    const showAll = req.query.all === 'true';

    let query = { category: new mongoose.Types.ObjectId(categoryId) };

    // Thêm điều kiện lọc giá nếu có
    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    console.log('Query để lọc sản phẩm:', JSON.stringify(query));

    // Lấy tất cả sản phẩm mà không giới hạn số lượng
    const products = await Models.Product
      .find(query)
      .populate('category', 'name')
      .lean();

    console.log(`Tìm thấy ${products.length} sản phẩm cho danh mục ${categoryId} với bộ lọc giá`);
    res.json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
    res.status(500).json({ error: 'Không thể lấy sản phẩm theo danh mục' });
  }
});

// Cập nhật endpoint sản phẩm:
// Cập nhật endpoint sản phẩm để xử lý đúng tham số 'all':
router.get('/products', async function (req, res) {
  try {
    console.log('Xử lý request GET /products, all=', req.query.all);

    const products = await ProductDAO.selectAll();

    // Chỉ giới hạn nếu tham số 'all' không phải 'true' và limit được chỉ định
    if (req.query.all !== 'true' && req.query.limit) {
      const limit = parseInt(req.query.limit);
      console.log(`Giới hạn ${limit} sản phẩm`);
      res.json(products.slice(0, limit));
    } else {
      console.log(`Trả về tất cả ${products.length} sản phẩm`);
      res.json(products);
    }
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách sản phẩm' });
  }
});

// Cập nhật endpoint sản phẩm bán chạy tương tự:
router.get('/products/hot', async function (req, res) {
  try {
    const limit = req.query.all === 'true' ? 100 : 10; // Tăng limit khi xem tất cả
    console.log(`Lấy sản phẩm bán chạy với limit: ${limit}`);
    
    const products = await ProductDAO.selectTopHot(limit);
    
    // Đảm bảo chỉ trả về những sản phẩm hợp lệ (không null hoặc undefined)
    const validProducts = products.filter(product => product && product._id);
    
    console.log(`Trả về ${validProducts.length} sản phẩm bán chạy`);
    res.json(validProducts);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm bán chạy:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy sản phẩm bán chạy'
    });
  }
});

// 6. Route để lấy một sản phẩm theo ID
router.get('/products/:id', async function (req, res) {
  try {
    console.log('Xử lý request GET /products/:id với ID =', req.params['id']);

    if (!mongoose.Types.ObjectId.isValid(req.params['id'])) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID sản phẩm không hợp lệ',
        code: 'INVALID_ID'
      });
    }

    const product = await Models.Product.findById(req.params['id'])
      .populate('category', 'name')
      .select('name price category image description createdAt')  // Thêm trường description vào các trường được chọn
      .lean();

    if (!product) {
      console.log(`Sản phẩm với ID ${req.params['id']} không tồn tại hoặc đã bị xóa`);
      return res.status(404).json({ 
        success: false, 
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message, 
      code: 'SERVER_ERROR'
    });
  }
});

// Route tìm kiếm thêm theo tham số truy vấn
router.get('/products/search', async function (req, res) {
  try {
    console.log('Xử lý request GET /products/search với tham số query');
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

    // Kiểm tra số điện thoại đã tồn tại
    const existingPhone = await CustomerDAO.selectByPhone(phone);
    
    // Tạo token kích hoạt
    const activationToken = crypto.randomBytes(20).toString('hex');
    const activationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const hashedPassword = CustomerDAO.hashPassword(password); // Mã hóa mật khẩu
    
    let customer;

    // Nếu số điện thoại đã tồn tại và là khách vãng lai, cập nhật thành tài khoản đăng ký
    if (existingPhone && existingPhone.isRegistered === false) {
      // Cập nhật thông tin khách hàng vãng lai thành tài khoản đăng ký
      const updateData = {
        username,
        password: hashedPassword,
        name,
        email,
        status: 'inactive',
        active: false,
        activationToken,
        activationExpires,
        isRegistered: true
      };
      
      customer = await CustomerDAO.update(existingPhone._id, updateData);
    } 
    // Nếu số điện thoại đã tồn tại và đã đăng ký, trả về lỗi
    else if (existingPhone && existingPhone.isRegistered === true) {
      return res.json({
        success: false,
        message: 'Số điện thoại đã được sử dụng'
      });
    }
    // Nếu số điện thoại chưa tồn tại, tạo khách hàng mới
    else {
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

      customer = await CustomerDAO.insert(newCustomer); // Thêm khách hàng vào DB
    }

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
    console.log('Đang xử lý yêu cầu thanh toán');
    const customer = req.body.customerInfo;
    const items = req.body.items;
    const paymentMethod = req.body.paymentMethod || 'cash';
    const deliveryOption = req.body.deliveryOption || 'standard';
    
    if (!customer || !items || items.length === 0) {
      return res.json({ success: false, message: 'Thiếu thông tin đặt hàng' });
    }

    console.log('Đã nhận các mặt hàng:', JSON.stringify(items));
    
    // Xác thực rằng tất cả các mặt hàng đều có ID sản phẩm và số lượng
    for (const item of items) {
      if (!item.product || !item.quantity) {
        return res.json({ 
          success: false, 
          message: 'Dữ liệu sản phẩm không hợp lệ. Vui lòng kiểm tra giỏ hàng của bạn.' 
        });
      }
    }

    // Xử lý thông tin khách hàng
    let customerInfo = { ...customer };
    let customerId = customer._id;
    
    // Kiểm tra xem khách hàng đã đăng nhập hay là khách vãng lai
    const isRegistered = !!customer.username;
    
    // Nếu khách vãng lai, kiểm tra xem đã có trong DB chưa hoặc tạo mới
    if (!isRegistered) {
      try {
        // Tìm khách hàng theo số điện thoại
        let existingCustomer = null;
        if (customer.phone) {
          existingCustomer = await CustomerDAO.findByPhone(customer.phone);
        }
        
        // Nếu không tìm thấy bằng số điện thoại, thử tìm bằng email
        if (!existingCustomer && customer.email) {
          existingCustomer = await CustomerDAO.selectByEmail(customer.email);
        }
        
        // Nếu tìm thấy, sử dụng thông tin khách hàng đã có
        if (existingCustomer) {
          console.log(`Đã tìm thấy khách hàng: ${existingCustomer._id}`);
          customerId = existingCustomer._id;
          // Cập nhật thông tin mới nhất nếu cần
          await CustomerDAO.update(existingCustomer._id, {
            name: customer.name || existingCustomer.name,
            email: customer.email || existingCustomer.email,
            address: customer.address || existingCustomer.address,
            // Đảm bảo rằng khách hàng giữ nguyên giá trị isRegistered hiện tại của họ
            isRegistered: existingCustomer.isRegistered
          });
        } else {
          // Tạo khách hàng mới (khách vãng lai)
          console.log('Tạo khách hàng mới (khách vãng lai)');
          const newCustomer = await CustomerDAO.insert({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            isRegistered: false, // Đảm bảo khách vãng lai có isRegistered = false
            status: 'active',
            active: true
          });
          customerId = newCustomer._id;
        }
      } catch (error) {
        console.error('Lỗi khi xử lý thông tin khách hàng:', error);
        // Tiếp tục xử lý đơn hàng dù có lỗi khi lưu thông tin khách hàng
      }
    }

    // Lấy chi tiết sản phẩm cho mỗi mặt hàng
    const itemsWithDetails = await Promise.all(items.map(async (item) => {
      try {
        // Nếu sản phẩm đã là một đối tượng với tất cả các trường cần thiết, sử dụng nó
        if (typeof item.product === 'object' && item.product.price) {
          return {
            product: item.product._id || item.product,
            quantity: item.quantity,
            price: item.product.price
          };
        }
        
        // Nếu không, lấy sản phẩm từ cơ sở dữ liệu
        const productId = typeof item.product === 'object' ? item.product._id : item.product;
        const product = await Models.Product.findById(productId).lean();
        
        if (!product) {
          throw new Error(`Sản phẩm không tồn tại: ${productId}`);
        }
        
        return {
          product: productId,
          quantity: item.quantity,
          price: product.price
        };
      } catch (err) {
        console.error('Lỗi xử lý mặt hàng:', err);
        throw new Error(`Lỗi xử lý sản phẩm: ${err.message}`);
      }
    }));

    // Tính tổng phụ dựa trên các mặt hàng và giá đã xác thực
    const subtotal = itemsWithDetails.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);

    // Tính phí vận chuyển dựa trên tùy chọn giao hàng
    const shippingFee = deliveryOption === 'express' ? 30000 : 0;
    
    // Tính tổng cuối cùng với phí vận chuyển
    const finalTotal = subtotal + shippingFee;

    // Tiếp tục với việc tạo đơn hàng
    const newOrderData = {
      customer: {
        _id: customerId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        isRegistered: isRegistered,
        type: isRegistered ? 'registered' : 'guest'
      },
      items: itemsWithDetails,
      subtotal: subtotal,
      shippingFee: shippingFee,
      total: finalTotal,
      status: 'pending',
      date: new Date(),
      paymentMethod: paymentMethod,
      deliveryOption: deliveryOption,
      giftWrap: req.body.giftWrap || false,
      giftMessage: req.body.giftMessage || '',
      note: req.body.note || ''
    };

    console.log('Tạo đơn hàng với dữ liệu:', {
      customerName: newOrderData.customer.name,
      itemCount: newOrderData.items.length,
      subtotal: newOrderData.subtotal,
      shippingFee: newOrderData.shippingFee,
      total: newOrderData.total,
      paymentMethod: newOrderData.paymentMethod,
      deliveryOption: newOrderData.deliveryOption
    });

    // Tạo đơn hàng
    const order = await OrderDAO.insert(newOrderData);

    // Gửi email xác nhận nếu khách hàng cung cấp email
    if (customer.email) {
      try {
        console.log('Chuẩn bị gửi email xác nhận đơn hàng đến:', customer.email);
        
        // Chuẩn bị các mặt hàng của đơn hàng với thông tin chi tiết
        const orderItems = await Promise.all(order.items.map(async (item) => {
          try {
            // Lấy dữ liệu sản phẩm đầy đủ để đảm bảo chúng ta có tất cả thông tin cần thiết
            const productId = typeof item.product === 'object' ? item.product._id : item.product;
            const product = await Models.Product.findById(productId).lean();
            
            if (!product) {
              throw new Error(`Không tìm thấy sản phẩm: ${productId}`);
            }
            
            // Xử lý URL hình ảnh
            const apiUrl = process.env.API_URL || 'http://localhost:8000';
            let imageUrl = '/images/product-default.jpg';
            
            if (product.image) {
              if (product.image.startsWith('http')) {
                imageUrl = product.image;
              } else {
                const imagePath = product.image.startsWith('/') ? product.image : `/${product.image}`;
                imageUrl = `${apiUrl}${imagePath}`;
              }
            }
            
            // Trả về thông tin sản phẩm đầy đủ
            return {
              product: {
                _id: product._id.toString(),
                name: product.name,
                image: imageUrl,
                price: product.price
              },
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.price * item.quantity
            };
          } catch (err) {
            console.log('Lỗi khi lấy thông tin sản phẩm:', err.message);
            return {
              product: {
                name: 'Sản phẩm không xác định',
                _id: typeof item.product === 'string' ? item.product : 'unknown',
                image: '/images/product-default.jpg',
                price: item.price || 0
              },
              quantity: item.quantity || 1,
              price: item.price || 0,
              totalPrice: (item.price || 0) * (item.quantity || 1)
            };
          }
        }));

        // Đảm bảo dữ liệu đơn hàng có cấu trúc đúng cho email
        const orderForEmail = {
          _id: order._id.toString(),
          date: order.date,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
          },
          items: orderItems,
          paymentMethod: paymentMethod,
          deliveryOption: deliveryOption,
          shippingFee: shippingFee,
          totalAmount: subtotal,
          finalTotal: finalTotal
        };

        console.log('Gửi email xác nhận đơn hàng với dữ liệu:', {
          orderId: orderForEmail._id,
          customer: orderForEmail.customer.name,
          email: orderForEmail.customer.email,
          paymentMethod: orderForEmail.paymentMethod,
          deliveryOption: orderForEmail.deliveryOption,
          totalItems: orderForEmail.items.length
        });

        // Ghi log cấu trúc đơn hàng trước khi gửi
        console.log('Cấu trúc dữ liệu đơn hàng trước khi gửi email:');
        console.log('- Order._id:', typeof orderForEmail._id, orderForEmail._id);
        console.log('- Customer:', orderForEmail.customer);
        console.log('- Độ dài mảng items:', orderForEmail.items?.length);
        console.log('- Xem trước mặt hàng đầu tiên:', orderForEmail.items && orderForEmail.items[0] ? 
          { 
            productType: typeof orderForEmail.items[0].product,
            product: orderForEmail.items[0].product,
            quantity: orderForEmail.items[0].quantity,
            price: orderForEmail.items[0].price
          } : 'Không có mặt hàng');

        // Đảm bảo các mặt hàng có thông tin sản phẩm đầy đủ trước khi gửi email
        // Lấy tất cả dữ liệu sản phẩm cần thiết cho các mặt hàng trong một truy vấn cơ sở dữ liệu để hiệu quả
        if (orderForEmail.items && Array.isArray(orderForEmail.items)) {
          try {
            // Trích xuất tất cả các ID sản phẩm cần tra cứu
            const productIds = orderForEmail.items
              .filter(item => typeof item.product === 'string' || (item.product && typeof item.product === 'object' && !item.product.name))
              .map(item => typeof item.product === 'string' ? item.product : (item.product?._id || ''));
            
            if (productIds.length > 0) {
              // Lấy tất cả sản phẩm trong một truy vấn
              const products = await Models.Product.find({ _id: { $in: productIds } }).lean();
              console.log(`Tìm thấy ${products.length} sản phẩm trong tổng số ${productIds.length} ID`);
              
              // Tạo bảng tra cứu để truy cập nhanh
              const productMap = {};
              products.forEach(product => {
                productMap[product._id.toString()] = product;
              });
              
              // Cập nhật các mặt hàng với dữ liệu sản phẩm đầy đủ
              orderForEmail.items = orderForEmail.items.map(item => {
                const productId = typeof item.product === 'string' ? 
                                item.product : 
                                (item.product && item.product._id ? item.product._id.toString() : '');
                
                // Nếu chúng ta có dữ liệu sản phẩm đầy đủ trong bảng tra cứu, sử dụng nó
                if (productId && productMap[productId]) {
                  const product = productMap[productId];
                  const apiUrl = process.env.API_URL || 'http://localhost:8000';
                  let imageUrl = '/images/product-default.jpg';
                  
                  // Xử lý URL hình ảnh
                  if (product.image) {
                    if (product.image.startsWith('http')) {
                      imageUrl = product.image;
                    } else {
                      const imagePath = product.image.startsWith('/') ? product.image : `/${product.image}`;
                      imageUrl = `${apiUrl}${imagePath}`;
                    }
                  }
                  
                  return {
                    product: {
                      _id: product._id.toString(),
                      name: product.name,
                      image: imageUrl,
                      price: product.price
                    },
                    quantity: item.quantity || 1,
                    price: item.price || product.price,
                    totalPrice: (item.price || product.price) * (item.quantity || 1)
                  };
                }
                
                // Nếu không tìm thấy, trả về một placeholder hoặc item hiện tại
                if (typeof item.product === 'object' && item.product) {
                  const apiUrl = process.env.API_URL || 'http://localhost:8000';
                  let imageUrl = '/images/product-default.jpg';
                  
                  if (item.product.image) {
                    if (item.product.image.startsWith('http')) {
                      imageUrl = item.product.image;
                    } else {
                      const imagePath = item.product.image.startsWith('/') ? item.product.image : `/${item.product.image}`;
                      imageUrl = `${apiUrl}${imagePath}`;
                    }
                  }
                  
                  return {
                    product: {
                      _id: item.product._id || '',
                      name: item.product.name || 'Sản phẩm không xác định',
                      image: imageUrl,
                      price: item.price || 0
                    },
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    totalPrice: (item.price || 0) * (item.quantity || 1)
                  };
                }
                
                // Fallback cho ID chuỗi không tìm thấy dữ liệu sản phẩm
                return {
                  product: {
                    _id: typeof item.product === 'string' ? item.product : 'unknown',
                    name: 'Sản phẩm không còn tồn tại',
                    image: '/images/product-default.jpg',
                    price: item.price || 0
                  },
                  quantity: item.quantity || 1,
                  price: item.price || 0,
                  totalPrice: (item.price || 0) * (item.quantity || 1)
                };
              });
            }
          } catch (err) {
            console.error('Lỗi khi lấy dữ liệu sản phẩm cho email:', err);
          }
        }

        // Ghi log những gì chúng ta đang gửi đến hàm email
        console.log('Mặt hàng đã xử lý cuối cùng cho email:');
        orderForEmail.items.forEach((item, index) => {
          console.log(`Mặt hàng ${index}:`, {
            id: item.product._id,
            name: item.product.name,
            image: item.product.image,
            price: item.price,
            quantity: item.quantity
          });
        });

        const emailResult = await EmailUtil.sendOrderConfirmationEmail(orderForEmail);
        
        if (emailResult && emailResult.success) {
          console.log('Email xác nhận đơn hàng đã được gửi thành công:', emailResult.messageId);
        } else if (emailResult) {
          console.error('Không thể gửi email xác nhận:', emailResult.error);
        } else {
          console.error('Không nhận được kết quả từ hàm gửi email');
        }
      } catch (emailError) {
        console.error('Lỗi gửi email xác nhận:', emailError);
        console.error('Chi tiết lỗi:', emailError.stack);
      }
    } else {
      console.log('Không gửi email xác nhận vì khách hàng không cung cấp địa chỉ email');
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
          product: item.product ? {
            _id: item.product._id,
            name: item.product.name,
            image: item.product.image,
            price: item.price
          } : {
            _id: null,
            name: 'Sản phẩm không còn tồn tại',
            image: '',
            price: item.price || 0
          },
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        shippingFee: order.shippingFee || 0,
        deliveryOption: order.deliveryOption || 'standard',
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

// Route lấy danh sách tỉnh thành
router.get('/provinces', async function (req, res) {
  try {
    const response = await axios.get('https://provinces.open-api.vn/api/');
    res.json(response.data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tỉnh thành:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu tỉnh thành' });
  }
});

// Route lấy thông tin chi tiết tỉnh thành
router.get('/provinces/:provinceCode', async function (req, res) {
  try {
    const { provinceCode } = req.params;
    const { depth } = req.query;
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}${depth ? `?depth=${depth}` : ''}`);
    res.json(response.data);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chi tiết tỉnh thành:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin chi tiết tỉnh thành' });
  }
});

// Route proxy lấy dữ liệu phường xã theo mã quận huyện 
router.get('/districts/:districtCode', async function (req, res) {
  try {
    const { districtCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    res.json(response.data);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chi tiết quận huyện:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin chi tiết quận huyện' });
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

    // Xác thực các trường bắt buộc
    if (!currentPassword || !newPassword) {
      return res.json({
        success: false,
        message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
      });
    }

    // Tìm khách hàng
    const customer = await CustomerDAO.selectById(customerId);
    if (!customer) {
      return res.json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Xác thực mật khẩu hiện tại
    if (!CustomerDAO.verifyPassword(currentPassword, customer.password)) {
      return res.json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = CustomerDAO.hashPassword(newPassword);

    // Cập nhật mật khẩu
    await CustomerDAO.updatePassword(customerId, hashedPassword);

    res.json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công'
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi mật khẩu:', error);
    res.json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi thay đổi mật khẩu'
    });
  }
});

// Route kiểm tra số điện thoại đã tồn tại
router.post('/check-phone', async function (req, res) {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.json({
        exists: false,
        message: 'Vui lòng cung cấp số điện thoại để kiểm tra',
        success: true
      });
    }

    // Tìm khách hàng đã đăng ký bằng số điện thoại
    const existingRegisteredPhone = await Models.Customer.findOne({ 
      phone: phone,
      isRegistered: true 
    });
    
    // Trả về kết quả
    res.json({
      exists: !!existingRegisteredPhone,
      message: existingRegisteredPhone ? 'Số điện thoại đã được đăng ký' : 'Số điện thoại có thể sử dụng',
      success: true
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra số điện thoại:', error);
    res.status(500).json({
      exists: false,
      message: 'Đã xảy ra lỗi khi kiểm tra số điện thoại',
      success: false,
      error: error.message
    });
  }
});

// Route kiểm tra email đã tồn tại
router.post('/check-email', async function (req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        exists: false,
        message: 'Vui lòng cung cấp email để kiểm tra'
      });
    }

    // Tìm khách hàng bằng email
    const existingEmail = await CustomerDAO.selectByEmail(email);

    // Trả về kết quả
    res.json({
      exists: !!existingEmail,
      message: existingEmail ? 'Email đã được sử dụng' : 'Email có thể sử dụng',
      success: true
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra email:', error);
    res.status(500).json({
      exists: false,
      message: 'Đã xảy ra lỗi khi kiểm tra email',
      success: false,
      error: error.message
    });
  }
});

// COMMENT API ROUTES

// Middleware xác thực token cho các API comment
const authenticateCustomer = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không tìm thấy token xác thực' });
  }

  try {
    const payload = JwtUtil.verifyToken(token);

    // Đảm bảo rằng chúng ta có ID của khách hàng
    if (!payload || !payload._id) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc thiếu thông tin khách hàng'
      });
    }

    // Lưu toàn bộ thông tin payload cho việc sử dụng sau này
    req.customer = {
      id: payload._id,              // ID của khách hàng
      username: payload.username,   // Username của khách hàng
      fullPayload: payload          // Lưu toàn bộ payload để sử dụng nếu cần
    };

    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Lấy bình luận theo sản phẩm - Không cần đăng nhập
router.get('/comments/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Kiểm tra ID sản phẩm hợp lệ
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    // Lấy bình luận cho sản phẩm
    try {
      const result = await CommentDAO.getCommentsByProduct(productId, page, limit);

      // Lấy đánh giá trung bình của sản phẩm
      const rating = await CommentDAO.getProductRating(productId);

      return res.json({
        success: true,
        data: {
          comments: result.comments || [],
          pagination: result.pagination || {
            total: 0,
            pages: 1,
            page: 1,
            limit: 10
          },
          rating: rating || {
            averageRating: 0,
            totalRatings: 0
          }
        }
      });
    } catch (commentError) {
      console.error('Lỗi khi xử lý bình luận:', commentError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý bình luận',
        data: {
          comments: [],
          pagination: {
            total: 0,
            pages: 1,
            page: 1,
            limit: 10
          },
          rating: {
            averageRating: 0,
            totalRatings: 0
          }
        }
      });
    }
  } catch (error) {
    console.error('Lỗi khi lấy bình luận:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy bình luận',
      error: error.message,
      data: {
        comments: [],
        pagination: {
          total: 0,
          pages: 1,
          page: 1,
          limit: 10
        },
        rating: {
          averageRating: 0,
          totalRatings: 0
        }
      }
    });
  }
});

// Tạo bình luận mới - Yêu cầu đăng nhập
router.post('/comments', authenticateCustomer, async (req, res) => {
  try {
    const { product, content, rating, parentId, replyToUser } = req.body;
    const customer = req.customer.id;

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    // Kiểm tra nếu đây là bình luận gốc hay trả lời
    let commentData = {
      product,
      customer,
      content,
      parentId: null
    };

    // Nếu là bình luận gốc, cần có đánh giá
    if (!parentId) {
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Đánh giá phải nằm trong khoảng từ 1 đến 5' });
      }
      commentData.rating = rating;
    } else {
      // Nếu là trả lời, cần kiểm tra parentId có tồn tại không
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, message: 'ID bình luận cha không hợp lệ' });
      }

      const parentComment = await CommentDAO.getCommentById(parentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận cha' });
      }

      commentData.parentId = parentId;
      // Trả lời bình luận không cần rating
      
      // Xử lý replyToUser nếu có
      if (replyToUser) {
        // Đảm bảo thông tin replyToUser hợp lệ
        if (replyToUser.userId || replyToUser.name || replyToUser.username) {
          commentData.replyToUser = {
            userId: replyToUser.userId,
            name: replyToUser.name,
            username: replyToUser.username
          };
        }
      }
    }

    try {
      const comment = await CommentDAO.createComment(commentData);

      res.status(201).json({
        success: true,
        message: 'Bình luận đã được tạo thành công',
        data: comment
      });
    } catch (commentError) {
      console.error('Lỗi khi tạo bình luận:', commentError);
      res.status(500).json({
        success: false,
        message: 'Không thể tạo bình luận: ' + commentError.message
      });
    }
  } catch (error) {
    console.error('Lỗi khi tạo bình luận:', error);
    res.status(500).json({ success: false, message: 'Không thể tạo bình luận', error: error.message });
  }
});

// Cập nhật bình luận - Yêu cầu đăng nhập
router.put('/comments/:id', authenticateCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;
    const customer = req.customer.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID bình luận không hợp lệ' });
    }

    // Kiểm tra bình luận tồn tại
    const existingComment = await CommentDAO.getCommentById(id);
    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Kiểm tra quyền sở hữu
    if (existingComment.customer._id.toString() !== customer) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa bình luận này' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    let updateData = { content };

    // Nếu là bình luận gốc, có thể cập nhật đánh giá
    if (existingComment.parentId === null && rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Đánh giá phải nằm trong khoảng từ 1 đến 5' });
      }
      updateData.rating = rating;
    }

    const updatedComment = await CommentDAO.updateComment(id, updateData);

    res.json({
      success: true,
      message: 'Bình luận đã được cập nhật thành công',
      data: updatedComment
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật bình luận:', error);
    res.status(500).json({ success: false, message: 'Không thể cập nhật bình luận', error: error.message });
  }
});

// Xóa bình luận - Yêu cầu đăng nhập
router.delete('/comments/:id', authenticateCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = req.customer.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID bình luận không hợp lệ' });
    }

    // Kiểm tra bình luận tồn tại
    const existingComment = await CommentDAO.getCommentById(id);
    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Kiểm tra quyền sở hữu
    if (existingComment.customer._id.toString() !== customer) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    await CommentDAO.deleteComment(id);

    res.json({
      success: true,
      message: 'Bình luận đã được xóa thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa bình luận:', error);
    res.status(500).json({ success: false, message: 'Không thể xóa bình luận', error: error.message });
  }
});

// Routes danh sách yêu thích
// Thêm sản phẩm vào danh sách yêu thích
router.post('/wishlist/add', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu thêm vào danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const { productId } = req.body;
        console.log('ID sản phẩm từ yêu cầu:', productId);

        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin sản phẩm' 
            });
        }

        const result = await WishlistDAO.addToWishlist(customerId, productId);
        console.log('Kết quả thêm vào danh sách yêu thích:', result);
        return res.json(result);
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi thêm vào danh sách yêu thích' 
        });
    }
});

// Xóa sản phẩm khỏi danh sách yêu thích
router.post('/wishlist/remove', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu xóa khỏi danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const { productId } = req.body;
        console.log('ID sản phẩm từ yêu cầu:', productId);

        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin sản phẩm' 
            });
        }

        const result = await WishlistDAO.removeFromWishlist(customerId, productId);
        console.log('Kết quả xóa khỏi danh sách yêu thích:', result);
        return res.json(result);
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi xóa khỏi danh sách yêu thích' 
        });
    }
});

// Lấy danh sách yêu thích của người dùng
router.get('/wishlist', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu lấy danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await WishlistDAO.getWishlist(customerId, page, limit);
        console.log('Kết quả lấy danh sách yêu thích:', { success: result.success, count: result.items?.length });
        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu thích:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi lấy danh sách yêu thích' 
        });
    }
});

// Kiểm tra sản phẩm có trong danh sách yêu thích không
router.get('/wishlist/check/:productId', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu kiểm tra danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const { productId } = req.params;
        console.log('ID sản phẩm từ yêu cầu:', productId);

        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin sản phẩm' 
            });
        }

        const result = await WishlistDAO.isInWishlist(customerId, productId);
        console.log('Kết quả kiểm tra danh sách yêu thích:', result);
        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi kiểm tra danh sách yêu thích:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi kiểm tra danh sách yêu thích' 
        });
    }
});

// Lấy số lượng sản phẩm trong danh sách yêu thích
router.get('/wishlist/count', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu lấy số lượng danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const result = await WishlistDAO.getWishlistCount(customerId);
        console.log('Kết quả lấy số lượng danh sách yêu thích:', result);
        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi lấy số lượng danh sách yêu thích:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi lấy số lượng sản phẩm yêu thích' 
        });
    }
});

// Xóa toàn bộ danh sách yêu thích
router.post('/wishlist/clear', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu xóa toàn bộ danh sách yêu thích');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const result = await WishlistDAO.clearWishlist(customerId);
        console.log('Kết quả xóa toàn bộ danh sách yêu thích:', result);
        return res.json(result);
    } catch (error) {
        console.error('Lỗi khi xóa toàn bộ danh sách yêu thích:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi xóa danh sách yêu thích' 
        });
    }
});

// Xóa một mục cụ thể trong danh sách yêu thích theo ID của item
router.post('/wishlist/removeById', JwtUtil.checkToken, async function (req, res) {
    try {
        console.log('Đang xử lý yêu cầu xóa mục danh sách yêu thích theo ID');
        // Trích xuất ID khách hàng trực tiếp từ payload token
        const customerId = req.jwtDecoded._id;
        console.log('ID khách hàng từ token:', customerId);
        
        const { wishlistItemId } = req.body;
        console.log('ID mục yêu thích từ yêu cầu:', wishlistItemId);

        if (!wishlistItemId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu ID của mục yêu thích' 
            });
        }

        // Gọi phương thức xóa từ WishlistDAO
        const result = await WishlistDAO.removeItemById(customerId, wishlistItemId);
        console.log('Remove wishlist item by ID result:', result);
        return res.json(result);
    } catch (error) {
        console.error('Error removing wishlist item by ID:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi xóa mục khỏi danh sách yêu thích' 
        });
    }
});

// API kiểm tra xem người dùng đã mua một sản phẩm cụ thể chưa
router.get('/orders/check-product/:productId', authenticateCustomer, async (req, res) => {
    try {
        const customerId = req.customer._id;
        const productId = req.params.productId;
        
        // Sử dụng truy vấn tiêu chuẩn để tìm các đơn hàng thay vì sử dụng phương thức có vấn đề
        const orders = await Models.Order.find({
            customerRef: customerId,
            'items.product': productId
        }).sort({ date: -1 });
        
        // Check if there are any completed orders with this product
        const completedOrders = orders.filter(order => 
            order.status === 'delivered' || order.status === 'shipping'
        );
        
        return res.json({
            success: true,
            data: {
                hasPurchased: completedOrders.length > 0
            }
        });
    } catch (error) {
        console.error('Error checking purchase history:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể kiểm tra lịch sử mua hàng'
        });
    }
});

module.exports = router;
