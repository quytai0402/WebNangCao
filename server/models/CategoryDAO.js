const mongooseUtil = require('../utils/MongooseUtil'); // Nhập thư viện MongooseUtil từ thư mục utils
const Models = require('./Models'); // Nhập các model từ file Models
const express = require('express'); // Nhập thư viện Express để tạo ứng dụng web
const router = express.Router(); // Tạo một router từ Express
const JwtUtil = require('../utils/JwtUtil'); // Nhập thư viện JwtUtil để xử lý JWT
const ProductDAO = require('../models/ProductDAO'); // Nhập ProductDAO từ file ProductDAO

// Định nghĩa đối tượng CategoryDAO
const CategoryDAO = {
    // Phương thức để lấy tất cả danh mục
    async selectAll() {
        const query = {}; // Tạo truy vấn rỗng để lấy tất cả danh mục
        const categories = await Models.Category.find(query).exec(); // Thực hiện truy vấn
        return categories; // Trả về danh sách danh mục
    },

    // Phương thức để chèn một danh mục mới
    async insert(category) {
        const mongoose = require('mongoose'); // Nhập thư viện mongoose
        category._id = new mongoose.Types.ObjectId(); // Tạo ID mới cho danh mục
        const result = await Models.Category.create(category); // Tạo danh mục trong cơ sở dữ liệu
        return result; // Trả về kết quả
    },

    // Phương thức để lấy các danh mục hàng đầu theo khoảng thời gian
    async getTopCategories(startDate, endDate) {
        try {
            // Chuyển đổi chuỗi ngày thành đối tượng Date
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Đặt giờ kết thúc

            // Đầu tiên, lấy tất cả danh mục
            const categories = await this.selectAll();
            
            // Tạo một map để đếm sản phẩm theo danh mục
            const categoryCounts = {};
            categories.forEach(category => {
                categoryCounts[category._id.toString()] = {
                    name: category.name,
                    count: 0
                };
            });
            
            // Lấy tất cả sản phẩm và đếm số lượng theo danh mục
            const products = await Models.Product.find().populate('category', 'name').lean();
            
            products.forEach(product => {
                if (product.category && product.category._id) {
                    const categoryId = product.category._id.toString();
                    if (categoryCounts[categoryId]) {
                        categoryCounts[categoryId].count++; // Tăng số lượng sản phẩm trong danh mục
                    }
                }
            });
            
            // Chuyển đổi thành mảng và sắp xếp theo số lượng
            const result = Object.values(categoryCounts)
                .filter(category => category.count > 0) // Lọc chỉ các danh mục có sản phẩm
                .sort((a, b) => b.count - a.count); // Sắp xếp giảm dần theo số lượng
            
            return result; // Trả về kết quả
        } catch (error) {
            console.error('Error in getTopCategories:', error); // Ghi log lỗi
            throw new Error(`Error getting top categories: ${error.message}`); // Ném lỗi
        }
    },

    // Phương thức để cập nhật một danh mục
    async update(id, updateData) {
        try {
            const result = await Models.Category.findByIdAndUpdate(
                id,
                updateData,
                { 
                    new: true,  // Trả về tài liệu đã cập nhật
                    runValidators: true  // Chạy trình xác thực trong quá trình cập nhật
                }
            );
            
            if (!result) {
                throw new Error('Category not found'); // Ném lỗi nếu không tìm thấy danh mục
            }
            
            return result; // Trả về kết quả
        } catch (error) {
            throw new Error(`Error updating category: ${error.message}`); // Ném lỗi
        }
    },

    // Phương thức để xóa một danh mục theo ID
    async delete(categoryId) {
        try {
            const result = await Models.Category.findByIdAndDelete(categoryId); // Xóa danh mục theo ID
            if (!result) {
                throw new Error('Category not found'); // Ném lỗi nếu không tìm thấy danh mục
            }
            return result; // Trả về kết quả của việc xóa
        } catch (error) {
            throw new Error(`Error deleting category: ${error.message}`); // Ném lỗi
        }
    },

    // Phương thức để lấy một danh mục theo ID
    async selectById(_id) {
        try {
            const category = await Models.Category.findById(_id).exec(); // Tìm danh mục theo ID
            if (!category) {
                throw new Error('Category not found'); // Ném lỗi nếu không tìm thấy danh mục
            }
            return category; // Trả về danh mục
        } catch (error) {
            throw new Error(`Error fetching category: ${error.message}`); // Ném lỗi
        }
    },

    // Phương thức để lấy danh mục ngẫu nhiên có sản phẩm
    async getRandomCategories(limit) {
        try {
            return await Models.Category.aggregate([
                { $sample: { size: limit } }, // Lấy mẫu ngẫu nhiên với kích thước giới hạn
                {
                    $lookup: { // Tham gia để tìm sản phẩm liên quan
                        from: 'products',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'products'
                    }
                },
                // Chỉ bao gồm các danh mục có sản phẩm
                { $match: { 'products.0': { $exists: true } } }
            ]);
        } catch (error) {
            throw new Error(`Error fetching random categories: ${error.message}`); // Ném lỗi
        }
    }
};

// Xuất đối tượng CategoryDAO
module.exports = CategoryDAO;
