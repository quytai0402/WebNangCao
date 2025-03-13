const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tranquytai0402@gmail.com',
        pass: 'yrti ipes lkwx bwgx'
    }
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount);
};

const EmailUtil = {
    sendOrderConfirmationEmail: async function (order) {
        try {
            console.log('Preparing to send order confirmation email with data:', {
                orderId: order._id,
                email: order.customerInfo.email,
                itemCount: order.items ? order.items.length : 0
            });

            if (!order.customerInfo || !order.customerInfo.email) {
                console.error('Missing email address for order confirmation');
                return { success: false, error: 'Missing email address' };
            }

            const orderId = order._id;
            const to = order.customerInfo.email;
            const name = order.customerInfo.name;
            const date = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const itemRows = order.items.map((item, index) => {
                try {
                    if (!item.product || typeof item.product !== 'object') {
                        console.warn(`Item ${index + 1} has invalid product data:`, item);
                        return `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    Sản phẩm không xác định
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                                    ${item.quantity || 0}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                    ${formatCurrency(item.price || 0)}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                    ${formatCurrency((item.price || 0) * (item.quantity || 0))}
                                </td>
                            </tr>
                        `;
                    }

                    return `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                ${item.product.name || 'Sản phẩm không xác định'}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                                ${item.quantity || 0}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                ${formatCurrency(item.price || 0)}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                ${formatCurrency((item.price || 0) * (item.quantity || 0))}
                            </td>
                        </tr>
                    `;
                } catch (err) {
                    console.error('Error generating item row HTML:', err);
                    return `<tr><td colspan="4">Error with item data</td></tr>`;
                }
            }).join('');

            const total = order.items.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                return sum + (price * quantity);
            }, 0);

            const info = await transporter.sendMail({
                from: 'Florista Flowers <tranquytai0402@gmail.com>',
                to: to,
                subject: `Đơn hàng #${orderId} - Florista Flowers`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px; color: #333;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #e75480;">Đơn hàng của bạn đã được tiếp nhận!</h2>
                            <p style="font-size: 16px;">Xin chào <strong>${name}</strong>,</p>
                            <p style="font-size: 16px;">Cảm ơn bạn đã mua hàng tại Florista Flowers.</p>
                        </div>
                        
                        <div style="background-color: #f8f8f8; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                            <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng #${orderId}</h3>
                            <p><strong>Ngày đặt:</strong> ${date}</p>
                            <p><strong>Tình trạng:</strong> <span style="color: #e75480;">Đang xử lý</span></p>
                            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cash' ? 'Tiền mặt khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #333;">Thông tin giao hàng</h3>
                            <p><strong>Người nhận:</strong> ${order.customerInfo.name}</p>
                            <p><strong>Số điện thoại:</strong> ${order.customerInfo.phone}</p>
                            <p><strong>Địa chỉ:</strong> ${order.customerInfo.address}</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #333;">Chi tiết đơn hàng</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f3f3f3;">
                                        <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                                        <th style="padding: 10px; text-align: center;">SL</th>
                                        <th style="padding: 10px; text-align: right;">Đơn giá</th>
                                        <th style="padding: 10px; text-align: right;">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemRows}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">
                                            Tổng tiền:
                                        </td>
                                        <td style="padding: 10px; text-align: right; font-weight: bold; color: #e75480;">
                                            ${formatCurrency(total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

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

    sendOrderStatusEmail: async function (order) {
        try {
            // Ensure necessary information is provided
            if (!order || !order.customerInfo || !order.customerInfo.email) {
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

            const statusLabel = statusLabels[order.status] || 'Không xác định';
            const statusDesc = statusDescriptions[order.status] || '';
            const statusColor = statusColors[order.status] || '#f8f9f9';
            const textColor = statusTextColors[order.status] || '#333';

            // Create products table
            let itemRows = '';
            let total = 0;

            if (order.items && Array.isArray(order.items)) {
                itemRows = order.items.map((item, index) => {
                    try {
                        if (!item.product || typeof item.product !== 'object') {
                            return `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                        Sản phẩm không xác định
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                                        ${item.quantity || 0}
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                        ${formatCurrency(item.price || 0)}
                                    </td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                        ${formatCurrency((item.price || 0) * (item.quantity || 0))}
                                    </td>
                                </tr>
                            `;
                        }

                        const itemTotal = item.quantity * item.price;
                        total += itemTotal;

                        return `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    ${item.product.name || 'Sản phẩm không xác định'}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                                    ${item.quantity || 0}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                    ${formatCurrency(item.price || 0)}
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                                    ${formatCurrency(itemTotal)}
                                </td>
                            </tr>
                        `;
                    } catch (err) {
                        console.error('Error generating item row HTML:', err);
                        return `<tr><td colspan="4">Error with item data</td></tr>`;
                    }
                }).join('');
            }

            const date = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // HTML template for email
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Cập nhật trạng thái đơn hàng</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
                <div style="text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(to right, #e75480, #ff758c);">
                    <h1 style="margin: 0; color: white; font-size: 24px;">Cập nhật trạng thái đơn hàng</h1>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px; background-color: white;">
                    <p style="font-size: 16px;">Xin chào <strong>${order.customerInfo.name}</strong>,</p>
                    
                    <p>Đơn hàng <strong>#${order._id}</strong> của bạn đã được cập nhật trạng thái mới:</p>
                    
                    <div style="background-color: ${statusColor}; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px solid rgba(0,0,0,0.05);">
                        <h2 style="margin: 0; color: ${textColor}; font-size: 20px;">${statusLabel}</h2>
                        <p style="margin: 10px 0 0; color: ${textColor};">${statusDesc}</p>
                    </div>
                    
                    <div style="background-color: #f8f8f8; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng #${order._id}</h3>
                        <p><strong>Ngày cập nhật:</strong> ${date}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333;">Chi tiết đơn hàng</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f3f3f3;">
                                    <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                                    <th style="padding: 10px; text-align: center;">SL</th>
                                    <th style="padding: 10px; text-align: right;">Đơn giá</th>
                                    <th style="padding: 10px; text-align: right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRows}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">
                                        Tổng tiền:
                                    </td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; color: #e75480;">
                                        ${formatCurrency(total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
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
                to: order.customerInfo.email,
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
