// Import thư viện multer để xử lý tệp tin
const multer = require('multer');
// Import CloudinaryStorage từ multer-storage-cloudinary để lưu trữ trên Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Import Cloudinary từ MyConstants
const { cloudinary } = require('../utils/MyConstants');

// Thiết lập kho lưu trữ Cloudinary cho multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Sử dụng đối tượng Cloudinary
  params: {
    folder: 'flower-shop', // Chỉ định thư mục nơi tệp sẽ được lưu trữ
    format: async (req, file) => 'webp', // Đặt định dạng hình ảnh là webp
    transformation: [
      { width: 500, height: 500, crop: 'fill' }, // Thay đổi kích thước hình ảnh thành 500x500
      { quality: 'auto', fetch_format: 'auto' }, // Tự động điều chỉnh chất lượng và định dạng
      { loading: 'lazy' }, // Bật tải lười
      { flags: 'progressive' }, // Sử dụng tải tiến bộ
      { effect: 'improve' }, // Áp dụng hiệu ứng cải thiện hình ảnh
      { quality: 'auto:good' } // Tối ưu hóa chất lượng
    ]
  }
});

// Tạo một instance middleware upload
const upload = multer({ storage: storage });

// Xuất middleware upload để sử dụng ở nơi khác
module.exports = upload;
