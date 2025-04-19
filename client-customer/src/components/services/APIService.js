import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/customer';

class APIService {
    // Phương thức tạo headers với token
    static getHeaders(token) {
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Lấy tất cả bình luận cho một sản phẩm
    static async getCommentsByProduct(productId, page = 1, limit = 10) {
        try {
            const response = await axios.get(
                `${BASE_URL}/comments/product/${productId}?page=${page}&limit=${limit}`
            );
            
            // Kiểm tra và đảm bảo cấu trúc dữ liệu đúng
            const responseData = response.data;
            
            // Nếu không có trường data, tạo trường data với giá trị mặc định
            if (responseData.success && !responseData.data) {
                responseData.data = {
                    comments: [],
                    rating: {
                        averageRating: 0,
                        totalRatings: 0,
                        ratingCounts: {}
                    },
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: 1
                    }
                };
            }
            
            return responseData;
        } catch (error) {
            console.error('Error fetching comments:', error);
            // Trả về dữ liệu mặc định khi có lỗi
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi tải bình luận',
                data: {
                    comments: [],
                    rating: {
                        averageRating: 0,
                        totalRatings: 0,
                        ratingCounts: {}
                    },
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: 1
                    }
                }
            };
        }
    }

    // Thêm bình luận mới
    static async addComment(data, token) {
        try {
            const response = await axios.post(
                `${BASE_URL}/comments`,
                data,
                { headers: this.getHeaders(token) }
            );
            return response.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    // Cập nhật bình luận
    static async updateComment(commentId, data, token) {
        try {
            const response = await axios.put(
                `${BASE_URL}/comments/${commentId}`,
                data,
                { headers: this.getHeaders(token) }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    }

    // Xóa bình luận
    static async deleteComment(commentId, token) {
        try {
            const response = await axios.delete(
                `${BASE_URL}/comments/${commentId}`,
                { headers: this.getHeaders(token) }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    // Kiểm tra lịch sử mua hàng
    static async checkPurchaseHistory(productId, token) {
        try {
            const response = await axios.get(
                `${BASE_URL}/orders/check-product/${productId}`,
                { headers: this.getHeaders(token) }
            );
            return response.data;
        } catch (error) {
            console.error('Error checking purchase history:', error);
            throw error;
        }
    }
}

export default APIService; 