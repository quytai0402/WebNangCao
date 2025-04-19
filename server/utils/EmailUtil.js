const nodemailer = require('nodemailer'); // Nhập thư viện nodemailer để gửi email
require('dotenv').config(); // Tải các biến môi trường từ file .env

// Tạo đối tượng transporter để gửi email thông qua SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Địa chỉ máy chủ SMTP
    port: parseInt(process.env.SMTP_PORT), // Cổng SMTP
    secure: process.env.SMTP_PORT === '465', // Xác định kết nối có bảo mật hay không dựa trên cổng
    auth: {
        user: process.env.SMTP_USER, // Tên người dùng SMTP
        pass: process.env.SMTP_PASS // Mật khẩu SMTP
    }
});

// Hàm định dạng số tiền thành chuỗi tiền tệ Việt Nam (VND)
const formatCurrency = (amount) => {
    // Đảm bảo amount là một số hợp lệ
    if (amount === undefined || amount === null || isNaN(amount)) {
        amount = 0;
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', // Định dạng kiểu tiền tệ
        currency: 'VND', // Đơn vị tiền tệ là đồng Việt Nam
        minimumFractionDigits: 0 // Không hiển thị phần thập phân
    }).format(amount);
};

// Thông tin tài khoản ngân hàng dùng để thanh toán
const bankInfo = {
    accountName: process.env.BANK_ACCOUNT_NAME || 'TRAN QUY TAI', // Tên chủ tài khoản
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '8866997979', // Số tài khoản
    bankName: process.env.BANK_NAME || 'TECHCOMBANK', // Tên ngân hàng
    branch: process.env.BANK_BRANCH || 'Chi nhánh TP.HCM', // Chi nhánh ngân hàng
    swift: process.env.BANK_SWIFT || 'VTCBVNVX' // Mã SWIFT
};

// Hàm tính phí vận chuyển dựa trên tổng giá trị đơn hàng
const calculateShippingFee = (subtotal) => {
    return 0; // Hiện tại miễn phí vận chuyển
};

// Hàm tạo URL QR code cho chuyển khoản ngân hàng
const generateQRCodeURL = (orderId, amount) => {
    try {
        // Chuẩn bị thông tin cho mã QR VietQR
        // Format theo chuẩn ngân hàng Việt Nam
        const formattedAmount = Math.floor(amount); // Làm tròn số tiền, bỏ phần thập phân
        const orderIdFormatted = orderId.toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 20); // Định dạng ID đơn hàng
        
        // Chuẩn bị thông tin cần thiết cho VietQR
        const bankId = "970407"; // Mã ngân hàng TECHCOMBANK
        const accountNo = bankInfo.accountNumber.replace(/\s+/g, ''); // Xóa khoảng trắng trong số tài khoản
        const template = "compact2"; // Template hiển thị rõ ràng hơn
        const content = `Thanh toan don hang ${orderIdFormatted}`; // Nội dung thanh toán (giới hạn 50 ký tự)
        
        // Tạo URL cho VietQR API - đảm bảo sử dụng HTTPS
        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${formattedAmount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
    } catch (error) {
        console.error('Error generating VietQR URL, using fallback:', error); // Ghi log lỗi
        
        // Phương thức dự phòng: Sử dụng Google Chart API khi VietQR gặp vấn đề
        const accountNo = bankInfo.accountNumber.replace(/\s+/g, '');
        const fallbackContent = `${bankInfo.bankName}|${accountNo}|${bankInfo.accountName}|${amount}|Thanh toan don hang ${orderId}`;
        return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(fallbackContent)}&choe=UTF-8`;
    }
};

// Hàm chuẩn bị dữ liệu sản phẩm trong đơn hàng để hiển thị trong email
const prepareOrderItems = (items) => {
    if (!items || !Array.isArray(items)) {
        console.log('prepareOrderItems received invalid items:', items); // Ghi log khi dữ liệu không hợp lệ
        return [];
    }
    
    console.log('prepareOrderItems received items array of length:', items.length); // Ghi log độ dài mảng sản phẩm
    
    return items.map((item, index) => {
        try {
            // Ghi log cấu trúc đầy đủ của item để gỡ lỗi
            console.log(`Processing item ${index}:`, JSON.stringify(item, null, 2));
            
            // Trường hợp 1: Xử lý khi item.product đã là một đối tượng đầy đủ
            if (item.product && typeof item.product === 'object' && 
                item.product.name && item.product._id) {
                
                console.log(`Item ${index} is already in normalized format`);
                
                // Chỉ sửa URL hình ảnh nếu cần
                let processedImage = item.product.image;
                if (processedImage && !processedImage.startsWith('http')) {
                    const apiUrl = process.env.API_URL || 'http://localhost:8000';
                    const imagePath = processedImage.startsWith('/') ? processedImage : `/${processedImage}`;
                    processedImage = `${apiUrl}${imagePath}`;
                } else if (!processedImage) {
                    // Sử dụng hình ảnh mặc định tốt hơn
                    processedImage = '/images/product-default.jpg';
                }
                
                return {
                    product: {
                        _id: item.product._id || '',
                        name: item.product.name,
                        image: processedImage,
                        price: item.product.price || item.price
                    },
                    quantity: item.quantity,
                    price: item.price,
                    totalPrice: item.price * item.quantity
                };
            }
            
            // Trường hợp 2: Nếu chỉ có ID sản phẩm, cố gắng lấy sản phẩm từ cơ sở dữ liệu
            if (typeof item.product === 'string' && item.product) {
                console.log(`Item ${index} - Product is a string ID:`, item.product);
                
                // LƯU Ý: Phần này sẽ không hoạt động vì không thể sử dụng await trong ngữ cảnh này
                // Mã ban đầu đã xử lý không đúng cuộc gọi bất đồng bộ như đồng bộ
                // Cần sử dụng phương pháp đồng bộ hoặc sửa đổi hàm tổng thể
                try {
                    const Models = require('../models/Models');
                    // Tạo đối tượng sản phẩm tối thiểu với ID mà chúng ta có
                    return {
                        product: {
                            _id: item.product,
                            name: 'Sản phẩm #' + item.product.substring(0, 6),
                            image: '/images/product-default.jpg',
                            price: item.price || 0
                        },
                        quantity: item.quantity || 1,
                        price: item.price || 0,
                        totalPrice: (item.price || 0) * (item.quantity || 1)
                    };
                } catch (err) {
                    console.error(`Error handling product with ID ${item.product}:`, err); // Ghi log lỗi
                }
            }
            
            // Trích xuất thông tin có sẵn từ item
            let productId = '', productName = '', productImage = '', productPrice = 0;
            
            if (typeof item.product === 'object' && item.product !== null) {
                // Nếu product là một đối tượng
                console.log(`Item ${index} - Product is an object:`, JSON.stringify(item.product, null, 2));
                productId = item.product._id || '';
                productName = item.product.name || 'Sản phẩm đã bị xóa khỏi hệ thống';
                productImage = item.product.image || '';
                productPrice = item.price || item.product.price || 0;
                console.log(`Item ${index} - Extracted data:`, { productId, productName, productImage, productPrice });
            } else {
                // Sử dụng thông tin item trực tiếp nếu có sẵn
                productId = '';
                productName = 'Sản phẩm đã bị xóa khỏi hệ thống';
                productImage = '';
                productPrice = item.price || 0;
            }
            
            // Chuẩn bị URL hình ảnh - Sửa lỗi xây dựng URL
            let processedImage = '';
            console.log(`Item ${index} - Raw image path:`, productImage);
            
            if (productImage) {
                if (productImage.startsWith('http')) {
                    // Nếu đã là URL đầy đủ, sử dụng nguyên bản
                    processedImage = productImage;
                    console.log(`Item ${index} - Image is already a full URL:`, processedImage);
                } else {
                    // Ngược lại, thêm tiền tố URL API - Sửa: đảm bảo đường dẫn bắt đầu bằng /
                    const apiUrl = process.env.API_URL || 'http://localhost:8000';
                    const imagePath = productImage.startsWith('/') ? productImage : `/${productImage}`;
                    processedImage = `${apiUrl}${imagePath}`;
                    console.log(`Item ${index} - Constructed image URL:`, processedImage);
                }
            } else {
                // Sử dụng hình ảnh mặc định tốt hơn thay vì placeholder
                processedImage = '/images/product-default.jpg';
                console.log(`Item ${index} - Using default image:`, processedImage);
            }
            
            const result = {
                product: {
                    _id: productId,
                    name: productName,
                    image: processedImage,
                    price: productPrice
                },
                quantity: item.quantity || 1,
                price: productPrice,
                totalPrice: productPrice * (item.quantity || 1)
            };
            
            console.log(`Item ${index} - Final processed item:`, JSON.stringify(result, null, 2));
            return result;
        } catch (err) {
            console.error(`Error processing item at index ${index}:`, err); // Ghi log lỗi xử lý item
            return {
                product: {
                    _id: '',
                    name: 'Sản phẩm đã bị xóa khỏi hệ thống',
                    image: '/images/product-default.jpg',
                    price: 0
                },
                quantity: 1,
                price: 0,
                totalPrice: 0
            };
        }
    });
};

const EmailUtil = {
    bankInfo,
    
    generateQRCodeURL,
    
    sendOrderConfirmationEmail: async function (order, token) {
        try {
            if (!order || !order.customer || !order.customer.email) {
                console.log('Invalid order data or missing email address');
                return;
            }

            console.log(`Sending order confirmation email to ${order.customer.email}`);

            // Prepare order items with normalized data
            const processedItems = prepareOrderItems(order.items);
            
            // Generate HTML rows for items
            let itemRows = '';
            
            try {
                itemRows = processedItems.map(item => {
                    // Ensure image URL is fully qualified
                    let imageUrl = item.product.image || '/images/product-default.jpg';
                    const apiUrl = process.env.API_URL || 'http://localhost:8000';
                    
                    if (!imageUrl.startsWith('http')) {
                        imageUrl = apiUrl + (imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`);
                    }
                    
                    console.log(`Email image for ${item.product.name}: ${imageUrl}`);
                    
                    return `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                <img src="${imageUrl}" alt="${item.product.name}" style="width: 50px; height: 50px; object-fit: cover;">
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                                ${item.product.name}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                                ${item.quantity}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                                ${formatCurrency(item.totalPrice)}
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (error) {
                console.log('Error processing items for display:', error);
                itemRows = '<tr><td colspan="4">Error displaying items</td></tr>';
            }

            // Calculate totals based on processed items
            const subtotal = processedItems.reduce((total, item) => total + item.totalPrice, 0) || order.totalAmount || 0;
            
            // Get shipping fee directly from order data
            const shippingFee = order.shippingFee || 0;
            
            // Use finalTotal from order or calculate it
            const finalTotal = order.finalTotal || (subtotal + shippingFee);

            // Format shipping fee display based on actual value
            const shippingFeeDisplay = (shippingFee === 0) ? 'Miễn phí' : formatCurrency(shippingFee);

            // Get delivery option from order and display it
            const deliveryOptionText = order.deliveryOption === 'express' ? 
                'Giao hàng nhanh (Trong ngày)' : 
                'Giao hàng tiêu chuẩn (2-3 ngày)';
                
            // Bank transfer section should only be included in the initial order confirmation
            // and should not be included in status update emails
            const bankTransferSection = order.paymentMethod === 'transfer' ? `
            <div style="margin-bottom: 30px; background-color: #f0f7ff; border: 1px solid #cce5ff; padding: 20px; border-radius: 5px;">
                <h3 style="color: #004085; margin-top: 0; text-align: center;">THÔNG TIN THANH TOÁN CHUYỂN KHOẢN</h3>
                <p style="margin-bottom: 15px; text-align: center;">Vui lòng chuyển khoản với thông tin sau để đơn hàng của bạn được xử lý nhanh chóng:</p>
                
                <div style="display: flex; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; padding: 10px;">
                        <p><strong>Ngân hàng:</strong> ${bankInfo.bankName}</p>
                        <p><strong>Chủ tài khoản:</strong> ${bankInfo.accountName}</p>
                        <p><strong>Số tài khoản:</strong> ${bankInfo.accountNumber}</p>
                        <p><strong>Chi nhánh:</strong> ${bankInfo.branch}</p>
                        <p><strong>Số tiền:</strong> ${formatCurrency(finalTotal)}</p>
                        <p><strong>Nội dung CK:</strong> Thanh toan don hang ${order._id}</p>
                    </div>
                    <div style="flex: 1; min-width: 250px; text-align: center; padding: 10px;">
                        <p style="margin-bottom: 10px; font-weight: bold; color: #004085;">QUÉT MÃ QR ĐỂ THANH TOÁN</p>
                        <div style="background: white; padding: 15px; display: inline-block; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
                            <img src="${generateQRCodeURL(order._id, finalTotal)}" 
                                alt="QR Code thanh toán" 
                                style="width: 200px; height: 200px;" />
                        </div>
                        <p style="font-size: 13px; color: #666; margin-top: 10px;">
                            Mở ứng dụng ngân hàng của bạn và quét mã này để thanh toán tự động
                        </p>
                    </div>
                </div>
                
                <p style="margin-top: 20px; font-weight: bold; color: #004085; text-align: center; background: #e6f2ff; padding: 10px; border-radius: 5px;">
                    Lưu ý: Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán của bạn
                </p>
            </div>
            ` : '';

            const info = await transporter.sendMail({
                from: 'Florista Flowers <tranquytai0402@gmail.com>',
                to: order.customer.email,
                subject: `Đơn hàng #${order._id} - Florista Flowers`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px; color: #333;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #e75480;">Đơn hàng của bạn đã được tiếp nhận!</h2>
                            <p style="font-size: 16px;">Xin chào <strong>${order.customer.name}</strong>,</p>
                            <p style="font-size: 16px;">Cảm ơn bạn đã mua hàng tại Florista Flowers.</p>
                        </div>
                        
                        <div style="background-color: #f8f8f8; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                            <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng #${order._id}</h3>
                            <p><strong>Ngày đặt:</strong> ${new Date().toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                            <p><strong>Tình trạng:</strong> <span style="color: #e75480;">Đang xử lý</span></p>
                            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cash' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
                            <p><strong>Phương thức vận chuyển:</strong> ${deliveryOptionText}</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #333;">Thông tin giao hàng</h3>
                            <p><strong>Người nhận:</strong> ${order.customer.name}</p>
                            <p><strong>Số điện thoại:</strong> ${order.customer.phone}</p>
                            <p><strong>Địa chỉ:</strong> ${order.customer.address}</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #333;">Chi tiết đơn hàng</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <thead>
                                    <tr style="background-color: #f8f8f8;">
                                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Hình ảnh</th>
                                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Tên sản phẩm</th>
                                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Số lượng</th>
                                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemRows}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tổng giá trị sản phẩm:</td>
                                        <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Phí vận chuyển:</td>
                                        <td style="padding: 10px; text-align: right; font-weight: bold;">
                                            ${shippingFeeDisplay}
                                        </td>
                                    </tr>
                                    <tr style="background-color: #f8f8f8;">
                                        <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">Tổng thanh toán:</td>
                                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #e75480; font-size: 16px;">${formatCurrency(finalTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        ${bankTransferSection}

                        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center;">
                            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email <a href="mailto:tranquytai0402@gmail.com" style="color: #e75480;">tranquytai0402@gmail.com</a> hoặc số điện thoại <strong>0972.898.369</strong>.</p>
                            <p style="color: #777; font-size: 14px;">Đây là email tự động, vui lòng không trả lời.</p>
                        </div>
                    </div>
                `
            });

            console.log('Order confirmation email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            console.error('Stack trace:', error.stack);
            console.error('Order data that caused the error:', JSON.stringify(order, null, 2));
            return { success: false, error: error.message };
        }
    },

    sendActivationEmail: async function (to, name, activationUrl) {
        try {
            const info = await transporter.sendMail({
                from: 'Florista Flowers <tranquytai0402@gmail.com>',
                to: to,
                subject: 'Kích hoạt tài khoản - Florista Flowers',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
                        <h2>Xin chào ${name},</h2>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại Florista Flowers. Vui lòng click vào link bên dưới để kích hoạt tài khoản:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${activationUrl}" style="display:inline-block;padding:12px 24px;background:#ff758c;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">
                                Kích hoạt tài khoản
                            </a>
                        </p>
                        <p>Link này sẽ hết hạn sau 24 giờ.</p>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                        <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 20px 0;">
                        <p style="font-size: 12px; color: #777;">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                `
            });
            console.log('Activation email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending activation email:', error);
            return { success: false, error: error.message };
        }
    },

    sendOrderStatusEmail: async function (order, status) {
        try {
            // Ensure necessary information is provided
            if (!order || !order.customer || !order.customer.email) {
                return {
                    success: false,
                    error: 'Thiếu thông tin khách hàng hoặc email'
                };
            }

            const statusLabels = {
                'pending': 'Chờ xử lý',
                'processing': 'Đang xử lý',
                'shipping': 'Đang giao hàng',
                'delivered': 'Đã giao hàng thành công',
                'cancelled': 'Đã hủy'
            };

            const statusDescriptions = {
                'pending': 'Đơn hàng của bạn đang chờ xử lý. Chúng tôi sẽ sớm tiến hành đóng gói sản phẩm.',
                'processing': 'Đơn hàng của bạn đang được xử lý và đóng gói. Chúng tôi sẽ gửi hàng trong thời gian sớm nhất.',
                'shipping': 'Đơn hàng của bạn đang được vận chuyển. Dự kiến sẽ đến tay bạn trong 2-3 ngày tới.',
                'delivered': 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm cùng chúng tôi!',
                'cancelled': 'Đơn hàng của bạn đã bị hủy theo yêu cầu hoặc do một số vấn đề phát sinh.'
            };

            const statusColors = {
                'pending': '#fff3cd',
                'processing': '#e8f4ff',
                'shipping': '#e8f5e9',
                'delivered': '#e0f2f1',
                'cancelled': '#ffebee'
            };

            const statusTextColors = {
                'pending': '#856404',
                'processing': '#0a5685',
                'shipping': '#2e7d32',
                'delivered': '#1a746b',
                'cancelled': '#c62828'
            };

            // Sử dụng status được truyền vào nếu có, nếu không thì lấy từ đối tượng order
            const currentStatus = status || order.status;
            const statusLabel = statusLabels[currentStatus] || 'Không xác định';
            const statusDesc = statusDescriptions[currentStatus] || '';
            const statusColor = statusColors[currentStatus] || '#f8f9f9';
            const textColor = statusTextColors[currentStatus] || '#333';

            // Prepare order items with normalized data
            const processedItems = prepareOrderItems(order.items);
            
            // Generate HTML rows for items
            const itemRows = processedItems.map(item => {
                // Ensure image URL is fully qualified
                let imageUrl = item.product.image || '/images/product-default.jpg';
                const apiUrl = process.env.API_URL || 'http://localhost:8000';
                
                if (!imageUrl.startsWith('http')) {
                    imageUrl = apiUrl + (imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`);
                }
                
                console.log(`Status Email image for ${item.product.name}: ${imageUrl}`);
                
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <img src="${imageUrl}" alt="${item.product.name}" style="width: 50px; height: 50px; object-fit: cover;">
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            ${item.product.name}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                            ${item.quantity}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                            ${formatCurrency(item.totalPrice)}
                        </td>
                    </tr>
                `;
            }).join('');

            // Calculate totals based on processed items
            const subtotal = processedItems.reduce((total, item) => total + item.totalPrice, 0) || order.totalAmount || 0;
            const finalTotal = subtotal + (order.shippingFee || 0);

            const date = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Define delivery option text based on order
            const deliveryOptionText = order.deliveryOption === 'express' ? 
                'Giao hàng nhanh (Trong ngày)' : 
                'Giao hàng tiêu chuẩn (2-3 ngày)';
                
            // Format shipping fee for display
            const shippingFeeDisplay = (order.shippingFee === 0) ? 'Miễn phí' : formatCurrency(order.shippingFee || 0);

            // In status update emails, never show bank transfer information
            const bankTransferSection = '';

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px; color: #333;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #e75480;">Cập nhật trạng thái đơn hàng #${order._id} - ${statusLabel}</h2>
                        <p style="font-size: 16px;">Xin chào <strong>${order.customer.name}</strong>,</p>
                        <p style="font-size: 16px;">Đơn hàng của bạn đã được cập nhật trạng thái thành <strong>${statusLabel}</strong>.</p>
                    </div>
                    
                    <div style="background-color: #f8f8f8; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng #${order._id}</h3>
                        <p><strong>Ngày đặt:</strong> ${date}</p>
                        <p><strong>Tình trạng:</strong> <span style="color: ${textColor};">${statusLabel}</span></p>
                        <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cash' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
                        <p><strong>Phương thức vận chuyển:</strong> ${deliveryOptionText}</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333;">Thông tin giao hàng</h3>
                        <p><strong>Người nhận:</strong> ${order.customer.name}</p>
                        <p><strong>Số điện thoại:</strong> ${order.customer.phone}</p>
                        <p><strong>Địa chỉ:</strong> ${order.customer.address}</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333;">Chi tiết đơn hàng</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="background-color: #f8f8f8;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Hình ảnh</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Tên sản phẩm</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Số lượng</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRows}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tổng giá trị sản phẩm:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Phí vận chuyển:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold;">
                                        ${shippingFeeDisplay}
                                    </td>
                                </tr>
                                <tr style="background-color: #f8f8f8;">
                                    <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">Tổng thanh toán:</td>
                                    <td style="padding: 12px; text-align: right; font-weight: bold; color: #e75480; font-size: 16px;">${formatCurrency(finalTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    ${bankTransferSection}

                    <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center;">
                        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email <a href="mailto:tranquytai0402@gmail.com" style="color: #e75480;">tranquytai0402@gmail.com</a> hoặc số điện thoại <strong>0972.898.369</strong>.</p>
                        <p style="color: #777; font-size: 14px;">Đây là email tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
                
                <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 14px; margin-top: 20px;">
                    <p>© 2025 Florista Flowers. Đã đăng ký bản quyền.</p>
                </div>
            </body>
            </html>
            `;

            // Setup email
            const mailOptions = {
                from: 'Florista Flowers <tranquytai0402@gmail.com>',
                to: order.customer.email,
                subject: `Cập nhật trạng thái đơn hàng #${order._id} - ${statusLabel}`,
                html: htmlContent
            };

            // Send email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email thông báo trạng thái đơn hàng đã được gửi:', info.messageId);
            
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Lỗi khi gửi email thông báo trạng thái:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Phương thức gửi email đặt lại mật khẩu
    sendResetPasswordEmail: async function (to, name, resetUrl) {
        try {
            const mailOptions = {
                from: `"Cửa hàng hoa" <${process.env.EMAIL_USER || 'tranquytai0402@gmail.com'}>`,
                to: to,
                subject: 'Yêu cầu đặt lại mật khẩu',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #ff758c; margin-bottom: 5px;">Đặt lại mật khẩu</h1>
                            <p style="color: #666;">Cửa hàng hoa của chúng tôi</p>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <p>Xin chào ${name},</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #ff758c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
                        </div>
                        
                        <div>
                            <p>Hoặc sao chép đường link sau vào trình duyệt của bạn:</p>
                            <p style="word-break: break-all; color: #0066cc; margin-bottom: 30px;">${resetUrl}</p>
                            <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
                            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Lỗi gửi email đặt lại mật khẩu:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = EmailUtil;
