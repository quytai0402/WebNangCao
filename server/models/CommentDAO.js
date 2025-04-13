const { Comment } = require('./Models');
const mongoose = require('mongoose');

class CommentDAO {
    constructor() {
        this.model = Comment;
    }

    // Tạo bình luận mới
    async createComment(commentData) {
        try {
            // Đảm bảo customer là một ObjectId hợp lệ
            if (!commentData.customer) {
                throw new Error('Thiếu thông tin người dùng');
            }
            
            let customerObjId;
            try {
                customerObjId = new mongoose.Types.ObjectId(commentData.customer);
                commentData.customer = customerObjId;
            } catch (err) {
                console.error('Invalid customer ObjectId format:', err);
                throw new Error('ID khách hàng không hợp lệ');
            }
            
            // Đảm bảo product là một ObjectId hợp lệ
            if (!commentData.product) {
                throw new Error('Thiếu thông tin sản phẩm');
            }
            
            let productObjId;
            try {
                productObjId = new mongoose.Types.ObjectId(commentData.product);
                commentData.product = productObjId;
            } catch (err) {
                console.error('Invalid product ObjectId format:', err);
                throw new Error('ID sản phẩm không hợp lệ');
            }
            
            // Phân tích nội dung để tìm mentions (@username)
            if (commentData.content) {
                // Mẫu regex để tìm @username
                const mentionRegex = /@(\w+)/g;
                const mentions = [];
                let match;
                
                // Tìm tất cả các mentions trong nội dung
                while ((match = mentionRegex.exec(commentData.content)) !== null) {
                    mentions.push(match[1]); // Thêm username (không có @)
                }
                
                // Lưu danh sách mentions vào commentData
                if (mentions.length > 0) {
                    commentData.mentions = mentions;
                }
            }
            
            // Nếu là reply (có parentId), đảm bảo không yêu cầu rating
            if (commentData.parentId) {
                // Nếu là reply, xử lý parentId
                let parentObjId;
                try {
                    parentObjId = new mongoose.Types.ObjectId(commentData.parentId);
                    commentData.parentId = parentObjId;
                    
                    // Nếu là reply thì không cần rating
                    if (commentData.rating) {
                        delete commentData.rating;
                    }

                    // Nếu là reply, không có verified purchase
                    commentData.verifiedPurchase = false;
                    
                    // Lấy thông tin comment cha để lưu thông tin replyTo
                    const parentComment = await this.model.findById(parentObjId)
                        .populate('customer', 'name username');
                        
                    if (parentComment && parentComment.customer) {
                        commentData.replyTo = {
                            customerId: parentComment.customer._id,
                            name: parentComment.customer.name,
                            username: parentComment.customer.username || parentComment.customer.name
                        };
                    }
                    
                    // Nếu có thông tin replyToUser (trả lời thẳng người dùng cụ thể)
                    if (commentData.replyToUser) {
                        const replyToUser = commentData.replyToUser;
                        
                        // Xác thực dữ liệu replyToUser
                        if (replyToUser.userId) {
                            try {
                                replyToUser.userId = new mongoose.Types.ObjectId(replyToUser.userId);
                            } catch (err) {
                                console.warn('Invalid replyToUser userId, but proceeding anyway');
                                // Không throw lỗi, chỉ cảnh báo
                            }
                        }
                        
                        // Đảm bảo có ít nhất name hoặc username
                        if (!replyToUser.name && !replyToUser.username) {
                            delete commentData.replyToUser;
                        }
                    }
                } catch (err) {
                    console.error('Invalid parent comment ObjectId format:', err);
                    throw new Error('ID bình luận cha không hợp lệ');
                }
            }

            // Ensure verifiedPurchase is a boolean
            if (commentData.verifiedPurchase !== undefined) {
                commentData.verifiedPurchase = Boolean(commentData.verifiedPurchase);
            } else {
                commentData.verifiedPurchase = false;
            }
            
            // Tạo một comment mới
            const newComment = new this.model(commentData);
            await newComment.save();
            
            // Nếu là reply, cập nhật mảng replies của comment cha
            if (commentData.parentId) {
                await this.model.findByIdAndUpdate(
                    commentData.parentId,
                    { $push: { replies: newComment._id } }
                );
            }
            
            return await this.model.findById(newComment._id)
                .populate('customer', 'name username isAdmin')
                .populate('product', 'name');
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    // Lấy tất cả bình luận cho một sản phẩm
    async getCommentsByProduct(productId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            // Lấy những bình luận gốc (không có parentId)
            const comments = await this.model.find({
                product: productId,
                parentId: null
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customer', 'name username')
            .populate({
                path: 'replies',
                populate: [
                    {
                        path: 'customer',
                        select: 'name username'
                    },
                    {
                        path: 'replyTo.customerId',
                        select: 'name username'
                    }
                ]
            });
            
            const total = await this.model.countDocuments({
                product: productId,
                parentId: null
            });
            
            return {
                comments,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Lấy tất cả bình luận (cho Admin)
    async getAllComments(page = 1, limit = 20) {
        try {
            console.log('CommentDAO - Getting all comments - page:', page, 'limit:', limit);
            
            // Đảm bảo page và limit là số nguyên dương
            page = Math.max(1, parseInt(page, 10) || 1);
            limit = Math.max(1, parseInt(limit, 10) || 20);
            
            const skip = (page - 1) * limit;
            
            // Thêm xử lý lỗi khi populate
            const comments = await this.model.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('customer', 'name username')
                .populate('product', 'name')
                .lean()
                .then(results => {
                    // Xử lý kết quả để đảm bảo không có tham chiếu null/undefined
                    return results.map(comment => ({
                        ...comment,
                        customer: comment.customer || { name: 'Người dùng đã xóa', username: '' },
                        product: comment.product || { name: 'Sản phẩm đã xóa' }
                    }));
                })
                .catch(err => {
                    console.error('Error retrieving comments:', err);
                    return [];
                });
            
            // Đếm tổng số bình luận
            const total = await this.model.countDocuments({})
                .catch(err => {
                    console.error('Error counting comments:', err);
                    return 0;
                });
            
            return {
                comments,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit) || 1
                }
            };
        } catch (error) {
            console.error('Error in getAllComments:', error);
            // Trả về kết quả rỗng thay vì throw lỗi
            return {
                comments: [],
                pagination: {
                    total: 0,
                    page: page,
                    limit: limit,
                    pages: 1
                }
            };
        }
    }

    // Lấy bình luận theo ID
    async getCommentById(id) {
        try {
            return await this.model.findById(id)
                .populate('customer', 'name username')
                .populate('product', 'name');
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật bình luận
    async updateComment(id, updateData) {
        try {
            updateData.updatedAt = new Date();
            updateData.isEdited = true;
            
            return await this.model.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }

    // Xóa bình luận
    async deleteComment(id) {
        try {
            const comment = await this.model.findById(id);
            
            if (!comment) {
                throw new Error('Không tìm thấy bình luận');
            }
            
            // Nếu có parentId, cập nhật mảng replies của comment cha
            if (comment.parentId) {
                await this.model.findByIdAndUpdate(
                    comment.parentId,
                    { $pull: { replies: id } }
                );
            }
            
            // Xóa tất cả các replies của comment này
            if (comment.replies && comment.replies.length > 0) {
                await this.model.deleteMany({
                    _id: { $in: comment.replies }
                });
            }
            
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
    
    // Lấy đánh giá trung bình của sản phẩm
    async getProductRating(productId) {
        try {
            // Chuyển đổi string productId thành ObjectId
            let productObjId;
            try {
                productObjId = new mongoose.Types.ObjectId(productId);
            } catch (err) {
                console.error('Invalid ObjectId format:', err);
                return {
                    averageRating: 0,
                    totalRatings: 0,
                    ratingCounts: {}
                };
            }

            // Lấy đánh giá trung bình và tổng số đánh giá
            const result = await this.model.aggregate([
                {
                    $match: {
                        product: productObjId,
                        rating: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$product',
                        averageRating: { $avg: '$rating' },
                        totalRatings: { $sum: 1 }
                    }
                }
            ]);
            
            // Lấy số lượng đánh giá cho từng số sao
            const ratingCountsResult = await this.model.aggregate([
                {
                    $match: {
                        product: productObjId,
                        rating: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ]);
            
            // Chuyển đổi kết quả thành đối tượng { 5: count5, 4: count4, ... }
            const ratingCounts = {};
            ratingCountsResult.forEach(item => {
                ratingCounts[item._id] = item.count;
            });
            
            if (result.length > 0) {
                return {
                    averageRating: result[0].averageRating,
                    totalRatings: result[0].totalRatings,
                    ratingCounts: ratingCounts
                };
            }
            
            return {
                averageRating: 0,
                totalRatings: 0,
                ratingCounts: {}
            };
        } catch (error) {
            console.error('Error getting product rating:', error);
            return {
                averageRating: 0,
                totalRatings: 0,
                ratingCounts: {}
            };
        }
    }

    // Lấy danh sách trả lời cho một bình luận
    async getRepliesByParentId(parentId) {
        try {
            // Chuyển đổi string parentId thành ObjectId
            let parentObjId;
            try {
                parentObjId = new mongoose.Types.ObjectId(parentId);
            } catch (err) {
                console.error('Invalid parent ObjectId format:', err);
                return [];
            }

            // Tìm các bình luận có parentId là id được cung cấp
            const replies = await this.model.find({
                parentId: parentObjId
            })
            .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tăng dần, cũ nhất trước
            .populate('customer', 'name username')
            .populate('product', 'name')
            .lean()
            .then(results => {
                // Xử lý kết quả để đảm bảo không có tham chiếu null/undefined
                return results.map(reply => ({
                    ...reply,
                    customer: reply.customer || { name: 'Người dùng đã xóa', username: '' },
                    product: reply.product || { name: 'Sản phẩm đã xóa' }
                }));
            })
            .catch(err => {
                console.error('Error retrieving replies:', err);
                return [];
            });

            return replies;
        } catch (error) {
            console.error('Error in getRepliesByParentId:', error);
            return [];
        }
    }
}

module.exports = new CommentDAO(); 