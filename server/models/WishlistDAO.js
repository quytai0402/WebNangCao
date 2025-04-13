const { Wishlist, Product } = require('./Models');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

class WishlistDAO {
    // Thêm sản phẩm vào danh sách yêu thích
    static async addToWishlist(customerId, productId) {
        try {
            // Đảm bảo productId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return { success: false, message: 'ID sản phẩm không hợp lệ' };
            }
            
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectProductId = new mongoose.Types.ObjectId(productId);
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findById(objectProductId);
            if (!product) {
                return { success: false, message: 'Sản phẩm không tồn tại' };
            }

            // Tạo hoặc cập nhật wishlist item
            const wishlistItem = await Wishlist.findOneAndUpdate(
                { customer: objectCustomerId, product: objectProductId },
                { customer: objectCustomerId, product: objectProductId, addedAt: new Date() },
                { upsert: true, new: true }
            );

            return { success: true, item: wishlistItem };
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                return { success: true, message: 'Sản phẩm đã có trong danh sách yêu thích' };
            }
            console.error('Error adding to wishlist:', error);
            return { success: false, message: 'Lỗi khi thêm vào danh sách yêu thích' };
        }
    }

    // Xóa sản phẩm khỏi danh sách yêu thích
    static async removeFromWishlist(customerId, productId) {
        try {
            // Đảm bảo productId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return { success: false, message: 'ID sản phẩm không hợp lệ' };
            }
            
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectProductId = new mongoose.Types.ObjectId(productId);
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            const result = await Wishlist.findOneAndDelete({ 
                customer: objectCustomerId, 
                product: objectProductId 
            });
            
            return { 
                success: !!result, 
                message: result ? 'Đã xóa khỏi danh sách yêu thích' : 'Sản phẩm không có trong danh sách yêu thích' 
            };
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return { success: false, message: 'Lỗi khi xóa khỏi danh sách yêu thích' };
        }
    }

    // Lấy danh sách yêu thích của người dùng
    static async getWishlist(customerId, page = 1, limit = 10) {
        try {
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            const skip = (page - 1) * limit;
            
            const items = await Wishlist.find({ customer: objectCustomerId })
                .sort({ addedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'product',
                    select: '_id name price image description category',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                });
            
            const total = await Wishlist.countDocuments({ customer: objectCustomerId });
            
            return {
                success: true,
                items,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting wishlist:', error);
            return { success: false, message: 'Lỗi khi lấy danh sách yêu thích' };
        }
    }

    // Kiểm tra sản phẩm có trong danh sách yêu thích không
    static async isInWishlist(customerId, productId) {
        try {
            // Đảm bảo productId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return { success: false, message: 'ID sản phẩm không hợp lệ' };
            }
            
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectProductId = new mongoose.Types.ObjectId(productId);
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            const item = await Wishlist.findOne({ 
                customer: objectCustomerId, 
                product: objectProductId 
            });
            
            return { success: true, isInWishlist: !!item };
        } catch (error) {
            console.error('Error checking wishlist:', error);
            return { success: false, message: 'Lỗi khi kiểm tra danh sách yêu thích' };
        }
    }

    // Lấy số lượng sản phẩm trong danh sách yêu thích
    static async getWishlistCount(customerId) {
        try {
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            const count = await Wishlist.countDocuments({ customer: objectCustomerId });
            return { success: true, count };
        } catch (error) {
            console.error('Error getting wishlist count:', error);
            return { success: false, message: 'Lỗi khi lấy số lượng sản phẩm yêu thích' };
        }
    }

    // Xóa toàn bộ danh sách yêu thích của người dùng
    static async clearWishlist(customerId) {
        try {
            // Đảm bảo customerId là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            const result = await Wishlist.deleteMany({ customer: objectCustomerId });
            return { 
                success: true, 
                deletedCount: result.deletedCount,
                message: 'Đã xóa toàn bộ danh sách yêu thích' 
            };
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return { success: false, message: 'Lỗi khi xóa danh sách yêu thích' };
        }
    }

    // Xóa một mục cụ thể trong danh sách yêu thích theo ID của mục
    static async removeItemById(customerId, wishlistItemId) {
        try {
            // Đảm bảo ID là objectId hợp lệ
            if (!mongoose.Types.ObjectId.isValid(wishlistItemId)) {
                return { success: false, message: 'ID mục yêu thích không hợp lệ' };
            }
            
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return { success: false, message: 'ID khách hàng không hợp lệ' };
            }

            // Chuyển đổi string ID sang ObjectId
            const objectItemId = new mongoose.Types.ObjectId(wishlistItemId);
            const objectCustomerId = new mongoose.Types.ObjectId(customerId);
            
            // Xóa mục với điều kiện ID mục và ID khách hàng (để bảo mật)
            const result = await Wishlist.findOneAndDelete({ 
                _id: objectItemId,
                customer: objectCustomerId
            });
            
            if (!result) {
                return { 
                    success: false, 
                    message: 'Không tìm thấy mục yêu thích hoặc bạn không có quyền xóa' 
                };
            }
            
            return { 
                success: true, 
                message: 'Đã xóa mục khỏi danh sách yêu thích' 
            };
        } catch (error) {
            console.error('Error removing item from wishlist by ID:', error);
            return { success: false, message: 'Lỗi khi xóa mục khỏi danh sách yêu thích' };
        }
    }
}

module.exports = WishlistDAO; 