const Models = require('./Models'); // Nhập các mô hình từ file Models
const mongoose = require('mongoose'); // Nhập thư viện mongoose để tương tác với MongoDB
const cloudinary = require('cloudinary').v2; // Nhập thư viện cloudinary để quản lý hình ảnh

class ProductDAO {
    // Phương thức chọn sản phẩm theo truy vấn với phân trang
    static async selectByQueryWithPagination(query, sortOptions, skip, limit) {
        try {
            return await Models.Product
                .find(query) // Tìm sản phẩm dựa trên truy vấn
                .select('name price category image cdate') // Chỉ lấy các trường cần thiết
                .populate('category', 'name') // Chỉ lấy trường tên của danh mục sản phẩm
                .sort(sortOptions) // Sắp xếp theo tùy chọn đã cho
                .skip(skip) // Bỏ qua số lượng bản ghi nhất định
                .limit(limit) // Giới hạn số lượng bản ghi trả về
                .lean() // Chuyển đổi kết quả thành đối tượng JavaScript thuần
                .exec(); // Thực thi truy vấn
        } catch (error) {
            console.error('Error in ProductDAO.selectByQueryWithPagination:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức đếm tổng số sản phẩm theo truy vấn
    static async count(query) {
        try {
            return await Models.Product.countDocuments(query); // Đếm số lượng sản phẩm theo truy vấn
        } catch (error) {
            console.error('Error in ProductDAO.count:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chèn sản phẩm mới vào cơ sở dữ liệu
    static async insert(product) {
        try {
            const newProduct = new Models.Product({
                _id: new mongoose.Types.ObjectId(), // Tạo ID mới cho sản phẩm
                ...product, // Sao chép các thuộc tính của sản phẩm từ tham số truyền vào
                cdate: new Date() // Thêm ngày tạo
            });
            const savedProduct = await newProduct.save(); // Lưu sản phẩm mới
            console.log('Product saved successfully:', savedProduct);
            return savedProduct;
        } catch (error) {
            console.error('Error in ProductDAO.insert:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức cập nhật thông tin sản phẩm theo ID
    static async update(id, product) {
        try {
            const result = await Models.Product.findByIdAndUpdate(
                id,
                {
                    $set: { // Cập nhật các trường
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        image: product.image,
                        description: product.description, // Thêm cập nhật trường description
                        cdate: new Date() // Cập nhật ngày sửa đổi
                    }
                },
                {
                    new: true, // Trả về tài liệu đã cập nhật
                    runValidators: true // Chạy xác thực
                }
            ).populate('category', 'name'); // Duyệt trường category và chỉ lấy tên

            if (!result) {
                throw new Error('Product not found'); // Nếu không tìm thấy sản phẩm
            }

            return result; // Trả về sản phẩm đã cập nhật
        } catch (error) {
            console.error('Error in ProductDAO.update:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức xóa sản phẩm theo ID
    static async delete(id) {
        try {
            const deletedProduct = await Models.Product.findByIdAndDelete(id); // Xóa sản phẩm
            if (!deletedProduct) {
                throw new Error('Product not found'); // Nếu không tìm thấy sản phẩm
            }
            return deletedProduct; // Trả về sản phẩm đã xóa
        } catch (error) {
            console.error('Error in ProductDAO.delete:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn sản phẩm theo ID
    static async selectById(id) {
        try {
            const product = await Models.Product.findById(id)
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean(); // Chuyển đổi kết quả thành đối tượng JavaScript thuần

            if (!product) {
                console.log(`Product with ID ${id} not found`); // Nếu không tìm thấy sản phẩm
                return null; // Trả về null
            }
            return product; // Trả về sản phẩm
        } catch (error) {
            console.error('Error in ProductDAO.selectById:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy URL hình ảnh tối ưu hóa từ Cloudinary
    static getOptimizedImageUrl(publicId) {
        return cloudinary.url(publicId, {
            secure: true, // Sử dụng https
            width: 500, // Đặt chiều rộng hình ảnh
            crop: 'fill', // Cắt hình ảnh
            quality: 'auto', // Tự động điều chỉnh chất lượng hình ảnh
            fetch_format: 'auto', // Tự động xác định định dạng hình ảnh
            loading: 'lazy' // Tải hình ảnh lười biếng
        });
    }

    // Phương thức chọn tất cả sản phẩm
    static async selectAll() {
        try {
            return await Models.Product
                .find({}) // Lấy tất cả sản phẩm
                .select('name price category image description cdate') // Thêm trường description
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean() // Chuyển đổi kết quả thành đối tượng JavaScript thuần
                .exec(); // Thực thi truy vấn
        } catch (error) {
            console.error('Error in ProductDAO.selectAll:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức chọn sản phẩm theo ID danh mục
    static async selectByCategory(categoryId) {
        try {
            console.log('Selecting products by category ID:', categoryId); // Ghi log ID danh mục

            const catId = new mongoose.Types.ObjectId(categoryId); // Chuyển đổi ID danh mục thành ObjectId

            const products = await Models.Product
                .find({ category: catId }) // Tìm sản phẩm theo ID danh mục
                .select('name price category image description cdate') // Thêm trường description
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean(); // Chuyển đổi kết quả thành đối tượng JavaScript thuần

            console.log(`Found ${products.length} products for category ${categoryId}`); // Ghi log số lượng sản phẩm tìm thấy
            return products; // Trả về danh sách sản phẩm
        } catch (error) {
            console.error('Error in ProductDAO.selectByCategory:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức tìm sản phẩm theo từ khóa
    static async selectByKeyword(keyword) {
        try {
            // Ghi log từ khóa tìm kiếm
            console.log('Search keyword:', keyword);

            const query = { name: { $regex: new RegExp(keyword, "i") } }; // Tạo truy vấn với regex để tìm tên sản phẩm
            console.log('Query:', JSON.stringify(query)); // Ghi log truy vấn

            const products = await Models.Product
                .find(query) // Tìm sản phẩm theo truy vấn
                .select('name price category image description cdate') // Thêm trường description
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean() // Chuyển đổi kết quả thành đối tượng JavaScript thuần
                .exec(); // Thực thi truy vấn

            console.log(`Found ${products.length} products matching "${keyword}"`); // Ghi log số lượng sản phẩm tìm thấy

            return products; // Trả về danh sách sản phẩm
        } catch (error) {
            console.error('Error in ProductDAO.selectByKeyword:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy sản phẩm bán chạy nhất theo doanh thu trong khoảng thời gian
    static async getTopProductsByRevenue(startDate, endDate) {
        try {
            // Chuyển đổi chuỗi ngày thành đối tượng Date
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Đặt thời gian cuối của ngày kết thúc

            // Tổng hợp đơn hàng để lấy doanh thu của sản phẩm
            const result = await Models.Order.aggregate([
                // Khớp các đơn hàng trong khoảng thời gian
                {
                    $match: {
                        date: {
                            $gte: start, // Ngày bắt đầu
                            $lte: end // Ngày kết thúc
                        },
                        status: 'delivered' // Chỉ lấy đơn hàng đã giao
                    }
                },
                // Phân tách mảng items
                { $unwind: '$items' },
                // Nhóm theo sản phẩm
                {
                    $group: {
                        _id: '$items.product', // Nhóm theo sản phẩm
                        quantity: { $sum: '$items.quantity' }, // Tổng số lượng
                        revenue: { 
                            $sum: { 
                                $multiply: ['$items.quantity', '$items.price'] // Tính tổng doanh thu
                            }
                        }
                    }
                },
                // Liên kết thông tin sản phẩm
                {
                    $lookup: {
                        from: 'products', // Bảng sản phẩm
                        localField: '_id', // Trường ID sản phẩm trong bảng đơn hàng
                        foreignField: '_id', // Trường ID trong bảng sản phẩm
                        as: 'product' // Tên trường để lưu kết quả
                    }
                },
                // Phân tách mảng sản phẩm từ liên kết
                { $unwind: '$product' },
                // Chọn các trường cần thiết
                {
                    $project: {
                        name: '$product.name', // Tên sản phẩm
                        quantity: 1, // Tổng số lượng
                        revenue: 1 // Doanh thu
                    }
                },
                // Sắp xếp theo doanh thu giảm dần
                { $sort: { revenue: -1 } },
                // Giới hạn số lượng sản phẩm trả về
                { $limit: 10 }
            ]);

            return result; // Trả về danh sách sản phẩm bán chạy
        } catch (error) {
            console.error('Error in getTopProductsByRevenue:', error); // Ghi log lỗi
            throw new Error(`Error getting top products by revenue: ${error.message}`); // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy sản phẩm mới nhất
    static async selectTopNew(limit) {
        try {
            const products = await Models.Product
                .find({})
                .sort({ cdate: -1 }) // Sắp xếp theo ngày tạo mới nhất
                .limit(parseInt(limit)) // Giới hạn số lượng
                .select('name price category image description cdate') // Thêm trường description
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean() // Chuyển đổi kết quả thành đối tượng JavaScript thuần
                .exec();

            // Trả về danh sách sản phẩm với định dạng mong muốn
            return products.map(product => ({
                _id: product._id,
                name: product.name,
                price: parseFloat(product.price) || 0, // Giá sản phẩm
                category: product.category, // Danh mục sản phẩm
                image: product.image, // Ảnh sản phẩm
                description: product.description, // Thêm mô tả vào kết quả trả về
                cdate: product.cdate ? new Date(product.cdate).toISOString() : null // Ngày tạo sản phẩm
            }));
        } catch (error) {
            console.error('Error in selectTopNew:', error); // Ghi log lỗi
            throw error; // Ném lỗi ra ngoài
        }
    }

    // Phương thức lấy sản phẩm hot nhất
    static async selectTopHot(limit) {
        try {
            // Kiểm tra xem có đơn hàng nào trong hệ thống không
            const orderCount = await Models.Order.countDocuments({ status: 'delivered' });
            
            // Nếu không có đơn hàng nào với trạng thái "đã giao", chuyển sang phương án dự phòng ngay lập tức
            if (orderCount === 0) {
                console.log('No delivered orders found in the database, using fallback options');
                return await this.getHotProductsFallback(limit);
            }
            
            // Tìm kiếm các sản phẩm bán chạy từ các đơn hàng đã giao
            const popularProducts = await Models.Order.aggregate([
                // Lọc chỉ lấy đơn hàng có trạng thái "đã giao"
                { $match: { status: 'delivered' } },
                // Phân tách mảng items để thống kê
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product', // Nhóm theo sản phẩm
                        count: { $sum: '$items.quantity' }, // Tổng số lượng
                        totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } // Tổng doanh thu
                    }
                },
                { $sort: { count: -1 } }, // Sắp xếp theo số lượng giảm dần
                { $limit: parseInt(limit) } // Giới hạn số lượng sản phẩm hot
            ]);
    
            const productIds = popularProducts.map(p => p._id);
            
            // Nếu không tìm thấy sản phẩm hot nào
            if (productIds.length === 0) {
                console.log('No hot products found based on delivered orders, using fallback options');
                return await this.getHotProductsFallback(limit);
            }
    
            // Lấy chi tiết sản phẩm phổ biến
            const products = await Models.Product
                .find({ _id: { $in: productIds } }) // Tìm sản phẩm theo ID
                .select('name price category image description cdate') // Thêm trường description
                .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
                .lean()
                .exec();
    
            // Sắp xếp sản phẩm theo thứ tự độ phổ biến
            const productMap = {};
            products.forEach(p => { productMap[p._id.toString()] = p; }); // Tạo bản đồ sản phẩm
            
            return popularProducts
                .map(p => {
                    const product = productMap[p._id.toString()]; // Lấy sản phẩm theo ID
                    if (product) {
                        return {
                            _id: product._id,
                            name: product.name,
                            price: parseFloat(product.price) || 0, // Giá sản phẩm
                            category: product.category, // Danh mục sản phẩm
                            image: product.image, // Ảnh sản phẩm
                            description: product.description, // Thêm mô tả vào kết quả trả về
                            cdate: product.cdate ? new Date(product.cdate).toISOString() : null, // Ngày tạo sản phẩm
                            isHot: true, // Đánh dấu là sản phẩm hot
                            salesCount: p.count || 0, // Số lượng bán
                            totalSales: p.totalSales || 0 // Tổng doanh thu
                        };
                    }
                    return null;
                })
                .filter(p => p); // Lọc những sản phẩm hợp lệ
        } catch (error) {
            console.error('Error in selectTopHot:', error); // Ghi log lỗi
            console.error('Error details:', error.stack); // Ghi log chi tiết lỗi
            
            try {
                return await this.getHotProductsFallback(limit);
            } catch (fallbackError) {
                console.error('Error in fallback for hot products:', fallbackError); // Ghi log lỗi fallback
                return []; // Trả về mảng rỗng
            }
        }
    }
    
    // Phương thức dự phòng để lấy sản phẩm hot khi không có đơn hàng
    static async getHotProductsFallback(limit) {
        // Tìm sản phẩm được đánh dấu là featured
        const featuredProducts = await Models.Product
            .find({ featured: true }) // Tìm sản phẩm nổi bật
            .limit(parseInt(limit)) // Giới hạn số lượng
            .select('name price category image description cdate') // Thêm trường description
            .populate('category', 'name') // Duyệt trường category và chỉ lấy tên
            .lean()
            .exec();
                
        if (featuredProducts.length > 0) {
            console.log(`Hiển thị ${featuredProducts.length} sản phẩm nổi bật thay thế cho sản phẩm bán chạy`);
            return featuredProducts.map(product => ({
                _id: product._id,
                name: product.name,
                price: parseFloat(product.price) || 0, // Giá sản phẩm
                category: product.category, // Danh mục sản phẩm
                image: product.image, // Ảnh sản phẩm
                isHot: true, // Đánh dấu là sản phẩm hot
                isFeatured: true, // Đánh dấu là sản phẩm nổi bật, không phải bán chạy thật sự
                salesCount: 0, // Số lượng bán
                description: product.description, // Thêm mô tả vào kết quả trả về
                cdate: product.cdate ? new Date(product.cdate).toISOString() : null // Ngày tạo sản phẩm
            }));
        }
            
        // Nếu không có sản phẩm featured, trả về mảng trống để hiển thị thông báo
        console.log('Không tìm thấy sản phẩm nổi bật, trả về mảng trống');
        return [];
    }
}

module.exports = ProductDAO; // Xuất class ProductDAO
