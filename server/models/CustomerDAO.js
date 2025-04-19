const Models = require('./Models'); // Nhập các mô hình từ file Models
const mongoose = require('mongoose'); // Nhập thư viện mongoose để làm việc với MongoDB
const bcrypt = require('bcryptjs'); // Nhập thư viện bcrypt để mã hóa mật khẩu

class CustomerDAO {
    // Lấy tất cả khách hàng
    static async selectAll() {
        try {
            const customers = await Models.Customer.find({}).lean(); // Tìm tất cả khách hàng và chuyển đổi thành đối tượng đơn giản
            return customers.map(customer => ({
                _id: customer._id.toString(),
                id: customer._id.toString(), // Để duy trì tương thích với phiên bản cũ
                name: customer.name || customer.fullname || 'Không có tên', // Nếu không có tên, trả về "Không có tên"
                email: customer.email || '', // Nếu không có email, trả về chuỗi rỗng
                phone: customer.phone || '', // Nếu không có số điện thoại, trả về chuỗi rỗng
                status: customer.status || 'inactive', // Nếu không có trạng thái, mặc định là 'inactive'
                date: customer.cdate || customer.createdAt || new Date(), // Nếu không có ngày tạo, sử dụng ngày hiện tại
                joinDate: customer.cdate || customer.createdAt || new Date(), // Ngày tham gia 
                isRegistered: !!customer.username, // Kiểm tra xem khách hàng đã đăng ký hay chưa
                totalOrders: customer.totalOrders || 0, // Tổng số đơn hàng
                totalSpent: customer.totalSpent || 0 // Tổng số tiền đã chi tiêu
            }));
        } catch (error) {
            throw error; // Ném lỗi nếu có xảy ra
        }
    }

    // Hàm mã hóa mật khẩu
    static hashPassword(password) {
        return bcrypt.hashSync(password, 10); // Mã hóa mật khẩu với độ khó 10
    }

    // Thêm phương thức updateTotalSpent với kiểm tra kỹ lưỡng hơn
    static async updateTotalSpent(customerId, amount) {
        try {
            console.log(`Updating total spent for customer ${customerId} by ${amount}`); // Log thông tin cập nhật

            // Đảm bảo customerId là một chuỗi hợp lệ
            if (typeof customerId !== 'string' && customerId.toString) {
                customerId = customerId.toString();
            }

            // Đảm bảo amount là một số
            amount = Number(amount);

            // Tìm khách hàng với truy vấn đơn giản
            const customer = await Models.Customer.findById(customerId);

            if (!customer) {
                console.error(`Customer with ID ${customerId} not found`); // Log lỗi nếu không tìm thấy khách hàng
                throw new Error(`Customer with ID ${customerId} not found`);
            }

            // Khởi tạo totalSpent nếu nó không tồn tại
            if (typeof customer.totalSpent !== 'number') {
                customer.totalSpent = 0;
            }

            // Tính toán tổng mới
            const oldTotal = customer.totalSpent; // Lưu tổng cũ
            customer.totalSpent += amount; // Cập nhật tổng mới

            // Đảm bảo totalSpent không bao giờ thấp hơn 0
            if (customer.totalSpent < 0) {
                customer.totalSpent = 0; // Nếu nhỏ hơn 0, đặt lại thành 0
            }

            console.log(`Customer ${customerId}: Total spent changing from ${oldTotal} to ${customer.totalSpent} (${amount > 0 ? '+' : ''}${amount})`);

            // Lưu thay đổi
            await customer.save();

            return customer; // Trả về khách hàng đã cập nhật
        } catch (error) {
            console.error(`Error updating total spent for customer ${customerId}:`, error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // So sánh mật khẩu và hash
    static verifyPassword(password, hash) {
        return bcrypt.compareSync(password, hash); // So sánh mật khẩu với hash
    }

    // Cập nhật tổng số đơn hàng
    static async incrementOrderCount(customerId) {
        try {
            await Models.Customer.findByIdAndUpdate(
                customerId,
                { $inc: { totalOrders: 1 } }, // Tăng tổng số đơn hàng lên 1
                { new: true } // Trả về tài liệu đã cập nhật
            );
            return true; // Trả về true nếu thành công
        } catch (error) {
            console.error('Error incrementing order count:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Giảm tổng số đơn hàng
    static async decrementOrderCount(customerId) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                customerId,
                { $inc: { totalOrders: -1 } }, // Giảm tổng số đơn hàng xuống 1
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            console.error('Error in CustomerDAO.decrementOrderCount:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Cập nhật trạng thái khách hàng
    static async updateStatus(id, status) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { status }, // Cập nhật trạng thái
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Tìm kiếm khách hàng theo tên, email hoặc số điện thoại
    static async searchCustomers(query) {
        const searchRegex = new RegExp(query, 'i'); // Tạo biểu thức chính quy để tìm kiếm không phân biệt hoa thường
        try {
            return await Models.Customer.find({
                $or: [ // Tìm kiếm theo nhiều điều kiện
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            });
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Thêm mới khách hàng
    static async insert(customer) {
        try {
            // Phân biệt khách vãng lai và khách đã đăng ký
            let newCustomer = {
                ...customer,
                // Nếu isRegistered được truyền vào, sử dụng nó
                // Nếu không, xác định dựa vào việc có username hay không
                isRegistered: customer.isRegistered !== undefined ? customer.isRegistered : !!customer.username
            };

            // Nếu là khách vãng lai, không yêu cầu username và password
            if (!newCustomer.isRegistered) {
                // Đảm bảo khách vãng lai mặc định là active
                newCustomer.status = 'active';
                newCustomer.active = true; // Đặt trạng thái là active
            }

            return await Models.Customer.create(newCustomer); // Tạo mới khách hàng trong cơ sở dữ liệu
        } catch (error) {
            console.error('Error in CustomerDAO.insert:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Cập nhật thông tin khách hàng
    static async update(id, updateData) {
        try {
            const result = await Models.Customer.findByIdAndUpdate(
                id,
                { $set: updateData }, // Cập nhật dữ liệu khách hàng
                { new: true } // Trả về tài liệu đã cập nhật
            );
            if (!result) {
                throw new Error('Customer not found'); // Ném lỗi nếu không tìm thấy khách hàng
            }
            return result; // Trả về kết quả
        } catch (error) {
            throw new Error(`Error updating customer: ${error.message}`); // Ném lỗi
        }
    }

    // Xóa khách hàng
    static async delete(id) {
        try {
            if (!id || id === 'undefined') {
                throw new Error('ID khách hàng không hợp lệ'); // Ném lỗi nếu ID không hợp lệ
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID khách hàng không đúng định dạng'); // Ném lỗi nếu ID không đúng định dạng
            }

            return await Models.Customer.findByIdAndDelete(id); // Xóa khách hàng theo ID
        } catch (error) {
            console.error('Error in CustomerDAO.delete:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Lấy chi tiết khách hàng theo ID
    static async selectById(id) {
        try {
            return await Models.Customer.findById(id); // Tìm khách hàng theo ID
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Đếm tổng số khách hàng theo query
    static async count(query) {
        try {
            return await Models.Customer.countDocuments(query); // Đếm số lượng khách hàng thỏa mãn điều kiện
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Lấy danh sách khách hàng theo query và phân trang
    static async selectByQueryWithPagination(query, sort, skip, limit) {
        try {
            const result = await Models.Customer
                .find(query) // Tìm khách hàng theo truy vấn
                .sort(sort) // Sắp xếp theo điều kiện
                .skip(skip) // Bỏ qua số lượng bản ghi đầu tiên
                .limit(limit) // Giới hạn số lượng bản ghi trả về
                .select('name username email phone status active isRegistered totalOrders totalSpent joinDate') // Chỉ chọn các trường cần thiết
                .lean(); // Chuyển đổi sang đối tượng đơn giản

            // Đảm bảo rằng tất cả khách hàng có trường isRegistered chính xác
            return result.map(customer => ({
                ...customer,
                // Giữ nguyên giá trị isRegistered từ DB, chỉ sử dụng username làm backup khi isRegistered không tồn tại
                isRegistered: customer.isRegistered !== undefined ? customer.isRegistered : !!customer.username
            }));
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Tìm khách hàng theo số điện thoại
    static async findByPhone(phone) {
        try {
            return await Models.Customer.findOne({ phone: phone }); // Tìm một khách hàng theo số điện thoại
        } catch (error) {
            console.error('Error in CustomerDAO.findByPhone:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Kiểm tra xem username đã tồn tại chưa
    static async findByUsername(username) {
        try {
            return await Models.Customer.findOne({ username: username }); // Tìm một khách hàng theo username
        } catch (error) {
            console.error('Error in CustomerDAO.findByUsername:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Cập nhật mật khẩu
    static async updatePassword(id, hashedPassword) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { password: hashedPassword }, // Cập nhật mật khẩu cho khách hàng
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            console.error('Error in CustomerDAO.updatePassword:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Kích hoạt tài khoản khách hàng
    static async activateAccount(id) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                {
                    active: true, // Đặt trạng thái kích hoạt là true
                    status: 'active', // Đặt trạng thái là active
                    activationToken: undefined, // Xóa token kích hoạt
                    activationExpires: undefined // Xóa thời gian hết hạn kích hoạt
                },
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Cập nhật tài liệu
    static async updateDocument(id, updateData) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                updateData, // Cập nhật dữ liệu
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Tìm kiếm khách hàng theo username hoặc email
    static async selectByUsernameOrEmail(usernameOrEmail) {
        try {
            return await Models.Customer.findOne({
                $or: [ // Tìm theo username hoặc email
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            });
        } catch (error) {
            throw error; // Ném lỗi
        }
    }

    // Khôi phục tài khoản khách hàng
    static async recoverAccount(id) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { active: false }, // Đặt trạng thái là không hoạt động
                { new: true } // Trả về tài liệu đã cập nhật
            );
        } catch (error) {
            console.error('Error in CustomerDAO.recoverAccount:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    // Tìm khách hàng theo số điện thoại
    static async selectByPhone(phone) {
        try {
            if (!phone) return null; // Nếu không có số điện thoại, trả về null

            // Đầu tiên kiểm tra khớp chính xác
            let customer = await Models.Customer.findOne({ phone: phone });

            // Nếu không tìm thấy, thử với giá trị đã cắt để xử lý vấn đề khoảng trắng
            if (!customer && typeof phone === 'string') {
                customer = await Models.Customer.findOne({ phone: phone.trim() });
            }

            return customer; // Trả về khách hàng tìm được
        } catch (error) {
            console.error('Error in CustomerDAO.selectByPhone:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }

    static async selectByEmail(email) {
        try {
            if (!email) return null; // Nếu không có email, trả về null

            // Đầu tiên kiểm tra khớp chính xác
            let customer = await Models.Customer.findOne({ email: email });

            // Nếu không tìm thấy, thử với giá trị đã cắt để xử lý vấn đề khoảng trắng
            if (!customer && typeof email === 'string') {
                customer = await Models.Customer.findOne({ email: email.trim() });
            }

            return customer; // Trả về khách hàng tìm được
        } catch (error) {
            console.error('Error in CustomerDAO.selectByEmail:', error); // Log lỗi
            throw error; // Ném lỗi
        }
    }
}

module.exports = CustomerDAO; // Xuất class CustomerDAO để sử dụng ở nơi khác
