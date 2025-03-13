const Models = require('./Models'); // Nhập các mô hình từ file Models
const mongoose = require('mongoose'); // Nhập thư viện mongoose để làm việc với MongoDB
const bcrypt = require('bcrypt'); // Nhập thư viện bcrypt để mã hóa mật khẩu
class CustomerDAO {
    // Lấy tất cả khách hàng
    static async selectAll() {
        try {
            const customers = await Models.Customer.find({}).lean();
            return customers.map(customer => ({
                _id: customer._id.toString(),
                id: customer._id.toString(), // For backward compatibility
                name: customer.name || customer.fullname || 'Không có tên',
                email: customer.email || '',
                phone: customer.phone || '',
                status: customer.status || 'inactive',
                date: customer.cdate || customer.createdAt || new Date(),
                joinDate: customer.cdate || customer.createdAt || new Date(),
                isRegistered: !!customer.username,
                totalOrders: customer.totalOrders || 0,
                totalSpent: customer.totalSpent || 0
            }));
        } catch (error) {
            throw error;
        }
    }
    static hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }
    // Thêm phương thức updateTotalSpent với kiểm tra kỹ lưỡng hơn
    static async updateTotalSpent(customerId, amount) {
        try {
            console.log(`Updating total spent for customer ${customerId} by ${amount}`);

            // Ensure customerId is a valid string
            if (typeof customerId !== 'string' && customerId.toString) {
                customerId = customerId.toString();
            }

            // Make sure amount is a number
            amount = Number(amount);

            // Find the customer directly with a simpler query
            const customer = await Models.Customer.findById(customerId);

            if (!customer) {
                console.error(`Customer with ID ${customerId} not found`);
                throw new Error(`Customer with ID ${customerId} not found`);
            }

            // Initialize totalSpent if it doesn't exist
            if (typeof customer.totalSpent !== 'number') {
                customer.totalSpent = 0;
            }

            // Calculate new total
            const oldTotal = customer.totalSpent;
            customer.totalSpent += amount;

            // Ensure totalSpent never goes below 0
            if (customer.totalSpent < 0) {
                customer.totalSpent = 0;
            }

            console.log(`Customer ${customerId}: Total spent changing from ${oldTotal} to ${customer.totalSpent} (${amount > 0 ? '+' : ''}${amount})`);

            // Save the changes
            await customer.save();

            return customer;
        } catch (error) {
            console.error(`Error updating total spent for customer ${customerId}:`, error);
            throw error;
        }
    }
    static verifyPassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }
    // Cập nhật tổng số đơn hàng
    static async incrementOrderCount(customerId) {
        try {
            await Models.Customer.findByIdAndUpdate(
                customerId,
                { $inc: { totalOrders: 1 } },
                { new: true }
            );
            return true;
        } catch (error) {
            console.error('Error incrementing order count:', error);
            throw error;
        }
    }

    // Giảm tổng số đơn hàng
    static async decrementOrderCount(customerId) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                customerId,
                { $inc: { totalOrders: -1 } },
                { new: true }
            );
        } catch (error) {
            console.error('Error in CustomerDAO.decrementOrderCount:', error);
            throw error;
        }
    }

    // Cập nhật trạng thái khách hàng
    static async updateStatus(id, status) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }

    // Tìm kiếm khách hàng theo tên, email hoặc số điện thoại
    static async searchCustomers(query) {
        const searchRegex = new RegExp(query, 'i');
        try {
            return await Models.Customer.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            });
        } catch (error) {
            throw error;
        }
    }

    // Thêm mới khách hàng
    // Thêm mới khách hàng
    static async insert(customer) {
        try {
            // Phân biệt khách vãng lai và khách đã đăng ký
            let newCustomer = {
                ...customer,
                isRegistered: !!customer.username
            };

            // Nếu là khách vãng lai, không yêu cầu username và password
            if (!newCustomer.isRegistered) {
                // Đảm bảo khách vãng lai mặc định là active
                newCustomer.status = 'active';
                newCustomer.active = true;
            }

            return await Models.Customer.create(newCustomer);
        } catch (error) {
            console.error('Error in CustomerDAO.insert:', error);
            throw error;
        }
    }

    // Cập nhật thông tin khách hàng
    static async update(id, updateData) {
        try {
            // Chuyển đổi string id thành ObjectId
            const objectId = new mongoose.Types.ObjectId(id);
            return await Models.Customer.findByIdAndUpdate(
                objectId,
                updateData,
                {
                    new: true,  // Trả về document đã cập nhật
                    runValidators: true  // Chạy validation khi update
                }
            );
        } catch (error) {
            console.error('Error in CustomerDAO.update:', error);
            throw error;
        }
    }

    // Xóa khách hàng
    static async delete(id) {
        try {
            if (!id || id === 'undefined') {
                throw new Error('ID khách hàng không hợp lệ');
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('ID khách hàng không đúng định dạng');
            }

            return await Models.Customer.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error in CustomerDAO.delete:', error);
            throw error;
        }
    }

    // Lấy chi tiết khách hàng theo ID
    static async selectById(id) {
        try {
            return await Models.Customer.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Đếm tổng số khách hàng theo query
    static async count(query) {
        try {
            return await Models.Customer.countDocuments(query);
        } catch (error) {
            throw error;
        }
    }

    // Lấy danh sách khách hàng theo query và phân trang
    static async selectByQueryWithPagination(query, sort, skip, limit) {
        try {
            return await Models.Customer
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
        } catch (error) {
            throw error;
        }
    }

    // Tìm khách hàng theo số điện thoại
    static async findByPhone(phone) {
        try {
            return await Models.Customer.findOne({ phone: phone });
        } catch (error) {
            console.error('Error in CustomerDAO.findByPhone:', error);
            throw error;
        }
    }

    // Kiểm tra xem username đã tồn tại chưa
    static async findByUsername(username) {
        try {
            return await Models.Customer.findOne({ username: username });
        } catch (error) {
            console.error('Error in CustomerDAO.findByUsername:', error);
            throw error;
        }
    }

    // Cập nhật mật khẩu
    static async updatePassword(id, hashedPassword) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { password: hashedPassword },
                { new: true }
            );
        } catch (error) {
            console.error('Error in CustomerDAO.updatePassword:', error);
            throw error;
        }
    }

    // Kích hoạt tài khoản khách hàng
    // Make sure this method exists in your CustomerDAO class
    static async activateAccount(id) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                {
                    active: true,
                    status: 'active',
                    activationToken: undefined,
                    activationExpires: undefined
                },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }
    // Thêm phương thức updateDocument nếu chưa có
    static async updateDocument(id, updateData) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }
    // Đảm bảo có phương thức này hoặc thêm vào nếu chưa có
    static async selectByUsernameOrEmail(usernameOrEmail) {
        try {
            return await Models.Customer.findOne({
                $or: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            });
        } catch (error) {
            throw error;
        }
    }

    // Khôi phục tài khoản khách hàng
    static async recoverAccount(id) {
        try {
            return await Models.Customer.findByIdAndUpdate(
                id,
                { active: false },
                { new: true }
            );
        } catch (error) {
            console.error('Error in CustomerDAO.recoverAccount:', error);
            throw error;
        }
    }
    // Tìm khách hàng theo số điện thoại
    // Make sure this method is implemented correctly
    static async selectByPhone(phone) {
        try {
            if (!phone) return null;

            // First check for exact match
            let customer = await Models.Customer.findOne({ phone: phone });

            // If not found, try with trimmed value to handle whitespace issues
            if (!customer && typeof phone === 'string') {
                customer = await Models.Customer.findOne({ phone: phone.trim() });
            }

            return customer;
        } catch (error) {
            console.error('Error in CustomerDAO.selectByPhone:', error);
            throw error;
        }
    }

    static async selectByEmail(email) {
        return await Models.Customer.findOne({ email });
      }
      
      static async update(id, updateData) {
        try {
          const result = await Models.Customer.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true } // Return updated document
          );
          if (!result) {
            throw new Error('Customer not found');
          }
          return result;
        } catch (error) {
          throw new Error(`Error updating customer: ${error.message}`);
        }
      }
}

module.exports = CustomerDAO; // Xuất class CustomerDAO để sử dụng ở nơi khác


