const Models = require('./Models');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

class ProductDAO {
    static async selectByQueryWithPagination(query, sortOptions, skip, limit) {
        try {
            return await Models.Product
                .find(query)
                .select('name price category image cdate') // Only retrieve necessary fields
                .populate('category', 'name') // Only get the name field of category
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean() // Convert Mongoose Document to plain JavaScript object
                .exec();
        } catch (error) {
            console.error('Error in ProductDAO.selectByQueryWithPagination:', error);
            throw error;
        }
    }

    static async count(query) {
        try {
            return await Models.Product.countDocuments(query);
        } catch (error) {
            console.error('Error in ProductDAO.count:', error);
            throw error;
        }
    }

    static async insert(product) {
        try {
            const newProduct = new Models.Product({
                _id: new mongoose.Types.ObjectId(),
                ...product,
                cdate: new Date() // Add creation date
            });
            return await newProduct.save();
        } catch (error) {
            console.error('Error in ProductDAO.insert:', error);
            throw error;
        }
    }

    static async update(id, product) {
        try {
            const result = await Models.Product.findByIdAndUpdate(
                id,
                {
                    $set: {
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        image: product.image,
                        cdate: new Date() // Update modification date
                    }
                },
                {
                    new: true, // Return the updated document
                    runValidators: true // Run validation
                }
            ).populate('category', 'name');

            if (!result) {
                throw new Error('Product not found');
            }

            return result;
        } catch (error) {
            console.error('Error in ProductDAO.update:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const deletedProduct = await Models.Product.findByIdAndDelete(id);
            if (!deletedProduct) {
                throw new Error('Product not found');
            }
            return deletedProduct;
        } catch (error) {
            console.error('Error in ProductDAO.delete:', error);
            throw error;
        }
    }

    static async selectById(id) {
        try {
            const product = await Models.Product.findById(id)
                .populate('category', 'name')
                .lean();

            if (!product) {
                console.log(`Product with ID ${id} not found`);
                return null;
            }
            return product;
        } catch (error) {
            console.error('Error in ProductDAO.selectById:', error);
            throw error;
        }
    }

    static getOptimizedImageUrl(publicId) {
        return cloudinary.url(publicId, {
            secure: true,
            width: 500,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
            loading: 'lazy'
        });
    }

    static async selectAll() {
        try {
            return await Models.Product
                .find({})
                .select('name price category image cdate')
                .populate('category', 'name')
                .lean()
                .exec();
        } catch (error) {
            console.error('Error in ProductDAO.selectAll:', error);
            throw error;
        }
    }

    static async selectByCategory(categoryId) {
        try {
            console.log('Selecting products by category ID:', categoryId);

            const catId = new mongoose.Types.ObjectId(categoryId);

            const products = await Models.Product
                .find({ category: catId })
                .populate('category', 'name')
                .lean();

            console.log(`Found ${products.length} products for category ${categoryId}`);
            return products;
        } catch (error) {
            console.error('Error in ProductDAO.selectByCategory:', error);
            throw error;
        }
    }
    static async selectByKeyword(keyword) {
        try {
            // Debug log để xác định từ khóa tìm kiếm
            console.log('Search keyword:', keyword);

            const query = { name: { $regex: new RegExp(keyword, "i") } };
            console.log('Query:', JSON.stringify(query));

            const products = await Models.Product
                .find(query)
                .select('name price category image cdate')
                .populate('category', 'name')
                .lean()
                .exec();

            console.log(`Found ${products.length} products matching "${keyword}"`);

            return products;
        } catch (error) {
            console.error('Error in ProductDAO.selectByKeyword:', error);
            throw error;
        }
    }
    // Add this new method to the ProductDAO class
static async getTopProductsByRevenue(startDate, endDate) {
    try {
        // Convert dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Aggregate orders to get product revenue
        const result = await Models.Order.aggregate([
            // Match orders within date range
            {
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            // Unwind items array
            { $unwind: '$items' },
            // Group by product
            {
                $group: {
                    _id: '$items.product',
                    quantity: { $sum: '$items.quantity' },
                    revenue: { 
                        $sum: { 
                            $multiply: ['$items.quantity', '$items.price'] 
                        }
                    }
                }
            },
            // Lookup product details
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            // Unwind product array from lookup
            { $unwind: '$product' },
            // Project final fields
            {
                $project: {
                    name: '$product.name',
                    quantity: 1,
                    revenue: 1
                }
            },
            // Sort by revenue descending
            { $sort: { revenue: -1 } },
            // Limit to top 10 products
            { $limit: 10 }
        ]);

        return result;
    } catch (error) {
        console.error('Error in getTopProductsByRevenue:', error);
        throw new Error(`Error getting top products by revenue: ${error.message}`);
    }
}
    // Phương thức lấy sản phẩm mới nhất
    static async selectTopNew(limit) {
        try {
            const products = await Models.Product
                .find({})
                .sort({ cdate: -1 }) // Sắp xếp theo ngày tạo mới nhất
                .limit(parseInt(limit))
                .select('name price category image cdate')
                .populate('category', 'name')
                .lean()
                .exec();

            return products.map(product => ({
                _id: product._id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                category: product.category,
                image: product.image,
                cdate: product.cdate ? new Date(product.cdate).toISOString() : null
            }));
        } catch (error) {
            console.error('Error in selectTopNew:', error);
            throw error;
        }
    }
    static async selectTopHot(limit) {
        try {
            // Mở rộng điều kiện tìm kiếm đơn hàng có thể hợp lệ
            const popularProducts = await Models.Order.aggregate([
                // Xóa bỏ điều kiện status quá nghiêm ngặt để có nhiều đơn hàng hơn
                // { $match: { status: { $in: ['delivered', 'completed', 'approved'] } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        count: { $sum: '$items.quantity' },
                        totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: parseInt(limit) }
            ]);
    
            const productIds = popularProducts.map(p => p._id);
            
            if (productIds.length === 0) {
                console.log('No hot products found based on orders, using featured products');
                
                // Tìm sản phẩm được đánh dấu featured
                const featuredProducts = await Models.Product
                    .find({ featured: true })
                    .limit(parseInt(limit))
                    .select('name price category image cdate')
                    .populate('category', 'name')
                    .lean()
                    .exec();
                    
                if (featuredProducts.length > 0) {
                    return featuredProducts.map(product => ({
                        _id: product._id,
                        name: product.name,
                        price: parseFloat(product.price) || 0,
                        category: product.category,
                        image: product.image,
                        isHot: true,
                        salesCount: 0 
                    }));
                }
                
                // Chỗ này là quan trọng: Nếu không có sản phẩm featured
                // Thay vì sắp xếp theo cdate như sản phẩm mới
                // Ta sắp xếp theo một tiêu chí khác để đảm bảo khác biệt
                console.log('No featured products found, using random selection fallback');
                
                // Phương án 1: Lấy ngẫu nhiên các sản phẩm
                const allProductIds = await Models.Product.find().select('_id').lean();
                const randomizedIds = allProductIds.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));
                
                const randomProducts = await Models.Product
                    .find({ _id: { $in: randomizedIds.map(p => p._id) } })
                    .select('name price category image cdate')
                    .populate('category', 'name')
                    .lean()
                    .exec();
                    
                return randomProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    price: parseFloat(product.price) || 0,
                    category: product.category,
                    image: product.image,
                    isHot: true,
                    salesCount: 0
                }));
            }
    
            // Code để lấy chi tiết sản phẩm phổ biến
            const products = await Models.Product
                .find({ _id: { $in: productIds } })
                .select('name price category image cdate')
                .populate('category', 'name')
                .lean()
                .exec();
    
            // Sort the products to match the popularity order
            const productMap = {};
            products.forEach(p => { productMap[p._id.toString()] = p; });
            
            return popularProducts
                .map(p => {
                    const product = productMap[p._id.toString()];
                    if (product) {
                        return {
                            _id: product._id,
                            name: product.name,
                            price: parseFloat(product.price) || 0,
                            category: product.category,
                            image: product.image,
                            cdate: product.cdate ? new Date(product.cdate).toISOString() : null,
                            isHot: true,
                            salesCount: p.count || 0,
                            totalSales: p.totalSales || 0
                        };
                    }
                    return null;
                })
                .filter(p => p);
        } catch (error) {
            console.error('Error in selectTopHot:', error);
            console.error('Error details:', error.stack);
            
            try {
                // Nếu có lỗi, tìm sản phẩm featured
                const featuredProducts = await Models.Product
                    .find({ featured: true })
                    .limit(parseInt(limit))
                    .select('name price category image cdate')
                    .populate('category', 'name')
                    .lean();
                    
                if (featuredProducts.length > 0) {
                    return featuredProducts.map(p => ({
                        ...p,
                        isHot: true,
                        salesCount: 0
                    }));
                }
                
                // Phương án fallback khác với sản phẩm mới
                const randomProducts = await Models.Product
                    .aggregate([{ $sample: { size: parseInt(limit) } }])
                    .project({ name: 1, price: 1, category: 1, image: 1, cdate: 1 });
                    
                return randomProducts.map(p => ({
                    ...p,
                    isHot: true,
                    salesCount: 0
                }));
            } catch (fallbackError) {
                console.error('Error in fallback for hot products:', fallbackError);
                return [];
            }
        }
    }
}

module.exports = ProductDAO;

