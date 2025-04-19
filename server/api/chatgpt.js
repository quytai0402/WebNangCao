// Nhập các module cần thiết
const express = require('express'); // Nhập thư viện Express để tạo API endpoints
const router = express.Router(); // Tạo router để định nghĩa các route
const OpenAI = require('openai'); // Nhập thư viện OpenAI để tương tác với ChatGPT
require('dotenv').config(); // Tải các biến môi trường từ file .env
const CategoryDAO = require('../models/CategoryDAO'); // Nhập DAO để tương tác với dữ liệu danh mục
const ProductDAO = require('../models/ProductDAO'); // Nhập DAO để tương tác với dữ liệu sản phẩm

// Thông tin về website để giúp ChatGPT xác định câu trả lời phù hợp
const websiteInfo = `
Thông tin về website thương mại điện tử của chúng tôi:

TÊN WEBSITE:
- Website thương mại điện tử chuyên bán hoa tươi và quà tặng.

SẢN PHẨM:
- Chúng tôi cung cấp các loại hoa tươi như hoa hồng, hoa cúc, hoa ly, hoa lan, hoa tulip.
- Bó hoa, giỏ hoa, hộp hoa, kệ hoa cho các dịp sinh nhật, khai trương, cưới hỏi, lễ tốt nghiệp.
- Hoa theo chủ đề: tình yêu, sinh nhật, chúc mừng, chia buồn, cảm ơn.
- Quà tặng kèm: gấu bông, socola, bánh kem, rượu vang.

GIÁ CẢ VÀ THANH TOÁN:
- Giá sản phẩm từ 200.000đ đến 2.000.000đ tùy loại hoa và kích thước.
- Khách hàng có thể thanh toán bằng thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng hoặc thanh toán khi nhận hàng (COD).
- Chúng tôi chấp nhận các loại thẻ Visa, Mastercard, JCB.

CHÍNH SÁCH GIAO HÀNG:
- Giao hàng miễn phí trong nội thành cho đơn hàng trên 500.000đ.
- Phí vận chuyển từ 30.000đ đến 50.000đ tùy khu vực.
- Thời gian giao hàng: 2 giờ trong nội thành và 4-24 giờ cho các tỉnh.
- Có dịch vụ giao gấp trong vòng 60 phút với phụ phí.

CHÍNH SÁCH ĐỔI TRẢ:
- Đổi hoặc hoàn tiền 100% nếu hoa không tươi khi giao.
- Chụp ảnh sản phẩm thực tế trước khi giao cho khách xác nhận.
- Cam kết hoa tươi trong vòng 3-5 ngày tùy loại hoa.

KHUYẾN MÃI:
- Giảm 10% cho lần mua hàng đầu tiên khi đăng ký thành viên.
- Thường xuyên có chương trình giảm giá vào các dịp lễ, tết.
- Tích điểm thưởng cho mỗi đơn hàng, quy đổi thành tiền khi mua sắm.

THÔNG TIN LIÊN HỆ:
- Hotline: 0972.898.369
- Email: tai.2274802010777@vanlanguni.vn
- Địa chỉ: 69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh 70000
- Giờ làm việc: 9h00 - 21h00 từ thứ Hai đến thứ Bảy, Chủ nhật 10h00 - 18h00

THÔNG TIN KHÁC:
- Nhận đặt hoa theo yêu cầu riêng.
- Dịch vụ thiết kế hoa cho sự kiện, văn phòng, nhà hàng, khách sạn.
- Đội ngũ florist chuyên nghiệp với nhiều năm kinh nghiệm.
`;

// Khởi tạo OpenAI với API key từ biến môi trường
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized successfully'); // Ghi log khi OpenAI được khởi tạo thành công
  } else {
    console.error('Invalid OpenAI API key format. API key should start with "sk-"'); // Ghi log lỗi khi API key không hợp lệ
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error); // Ghi log lỗi khi có lỗi xảy ra trong quá trình khởi tạo
}

// Các câu trả lời dự phòng cho một số câu hỏi phổ biến 
// Được sử dụng khi không có kết nối đến OpenAI hoặc khi có vấn đề với API
const fallbackResponses = {
  'shipping': 'Chúng tôi cung cấp giao hàng miễn phí trong nội thành cho đơn hàng trên 500.000đ. Phí vận chuyển từ 30.000đ đến 50.000đ tùy khu vực. Thời gian giao hàng chỉ 2 giờ trong nội thành và 4-24 giờ cho các tỉnh. Chúng tôi còn có dịch vụ giao gấp trong vòng 60 phút với phụ phí.',
  
  'payment': 'Chúng tôi chấp nhận thanh toán bằng thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng hoặc thanh toán khi nhận hàng (COD). Chúng tôi chấp nhận các loại thẻ Visa, Mastercard, JCB.',
  
  'return': 'Chúng tôi đổi hoặc hoàn tiền 100% nếu hoa không tươi khi giao. Chúng tôi luôn chụp ảnh sản phẩm thực tế trước khi giao cho khách xác nhận. Cam kết hoa tươi trong vòng 3-5 ngày tùy loại hoa.',
  
  'discount': 'Chúng tôi có nhiều chương trình khuyến mãi: Giảm 10% cho lần mua hàng đầu tiên khi đăng ký thành viên và thường xuyên có chương trình giảm giá vào các dịp lễ, tết. Bạn cũng có thể tích điểm thưởng cho mỗi đơn hàng và quy đổi thành tiền khi mua sắm.',
  
  'contact': 'Thông tin liên hệ của chúng tôi như sau: \n- Hotline: 0972.898.369 \n- Email: tai.2274802010777@vanlanguni.vn \n- Địa chỉ: 69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh 70000 \n- Giờ làm việc: 9h00 - 21h00 từ thứ Hai đến thứ Bảy, Chủ nhật 10h00 - 18h00 \nNếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào khác, vui lòng liên hệ với chúng tôi qua hotline, email hoặc địa chỉ trên. Chúng tôi sẽ sẵn lòng giúp đỡ bạn.',
  
  'product': '- Chúng tôi cung cấp các loại hoa tươi như hoa hồng, hoa cúc, hoa ly, hoa lan, hoa tulip.\n\n- Bó hoa, giỏ hoa, hộp hoa, kệ hoa cho các dịp sinh nhật, khai trương, cưới hỏi, lễ tốt nghiệp.\n\n- Hoa theo chủ đề: tình yêu, sinh nhật, chúc mừng, chia buồn, cảm ơn.',
  
  'roses': 'Chúng tôi cung cấp nhiều loại hoa hồng đa dạng với nhiều màu sắc như đỏ, hồng, trắng, vàng, cam, tím. Hoa hồng của chúng tôi được nhập từ Đà Lạt và các vườn hoa nổi tiếng, đảm bảo tươi lâu. Giá hoa hồng dao động từ 300.000đ đến 1.500.000đ tùy theo số lượng và cách trình bày.',
  
  'lilies': 'Hoa Ly của chúng tôi có nhiều loại: Ly Mỹ, Ly Đài Loan với đa dạng màu sắc. Hoa ly tượng trưng cho sự thanh cao, thuần khiết và thường được sử dụng trong các dịp sinh nhật, khai trương hoặc đám cưới. Giá dao động từ 350.000đ đến 1.800.000đ tùy theo số lượng.',
  
  'orchids': 'Chúng tôi có nhiều loại hoa lan như lan hồ điệp, lan mokara, và lan dendrobium. Hoa lan tượng trưng cho sự sang trọng và tinh tế, thích hợp làm quà tặng hay trang trí. Giá dao động từ 400.000đ đến 2.000.000đ tùy loại và cách trình bày.',
  
  'birthday': 'Cho dịp sinh nhật, chúng tôi có nhiều lựa chọn bó hoa, giỏ hoa tươi sáng với màu sắc rực rỡ như hoa hồng, hoa cúc, hướng dương. Quý khách có thể đặt kèm bánh kem, socola hoặc gấu bông để tạo bất ngờ. Giá dao động từ 350.000đ đến 1.500.000đ tùy theo yêu cầu.',
  
  'wedding': 'Đối với đám cưới, chúng tôi cung cấp hoa cầm tay cô dâu, hoa cài áo chú rể, hoa bàn tiệc, hoa trang trí xe. Các loại hoa phổ biến cho đám cưới là hoa hồng, cẩm tú cầu, hoa baby. Vui lòng liên hệ trước ít nhất 1 tuần để chúng tôi chuẩn bị chu đáo. Giá trọn gói từ 5.000.000đ.',
  
  'congratulation': 'Hoa chúc mừng khai trương, tốt nghiệp thường là kệ hoa hoặc giỏ hoa lớn với tông màu tươi sáng và rực rỡ như vàng, đỏ, cam. Chúng tôi có nhiều mẫu kệ hoa chúc mừng từ 1-3 tầng, giá từ 700.000đ đến 2.000.000đ.',
  
  'condolence': 'Hoa chia buồn của chúng tôi thường là vòng hoa tang lễ hoặc kệ hoa với tông màu trắng, tím nhạt thể hiện sự trang nghiêm. Chúng tôi cam kết giao hàng đúng giờ trong các dịp này. Vòng hoa giá từ 600.000đ đến 1.500.000đ.',
  
  'freshness': 'Chúng tôi cam kết hoa luôn tươi mới khi giao đến tay khách hàng. Hoa được cắt và xử lý đúng kỹ thuật để giữ tươi lâu. Chúng tôi luôn chụp ảnh thực tế trước khi giao và cam kết đổi/hoàn tiền 100% nếu hoa không đạt yêu cầu về độ tươi.',
  
  'custom': 'Chúng tôi nhận đặt hoa theo yêu cầu riêng của khách hàng. Quý khách có thể chọn loại hoa, màu sắc, cách trình bày theo ý thích. Đội ngũ florist chuyên nghiệp của chúng tôi sẽ tư vấn và thiết kế theo mong muốn của bạn. Vui lòng liên hệ trước 24h để chúng tôi chuẩn bị.',
  
  'event': 'Chúng tôi có dịch vụ trang trí hoa cho sự kiện, tiệc cưới, hội nghị, khai trương. Đội ngũ thiết kế sẽ tư vấn concept và thực hiện trang trí tận nơi. Vui lòng liên hệ trước ít nhất 1 tuần để được tư vấn và báo giá chi tiết.',
  
  'preservation': 'Để giữ hoa tươi lâu hơn, bạn nên: \n- Cắt chéo gốc hoa trước khi cắm \n- Thay nước mỗi ngày \n- Để hoa ở nơi thoáng mát, tránh ánh nắng trực tiếp \n- Tránh để gần trái cây, nhất là táo vì chúng sinh ra khí ethylene làm hoa nhanh héo \n- Bổ sung dưỡng chất giữ hoa tươi (có bán kèm theo)'
};

// Hàm tìm câu trả lời dự phòng dựa trên từ khóa trong câu hỏi
// Được sử dụng để trả về câu trả lời phù hợp khi không thể sử dụng OpenAI API
const findFallbackResponse = (message) => {
  const messageLower = message.toLowerCase(); // Chuyển đổi tin nhắn thành chữ thường để dễ dàng so sánh
  
  // Kiểm tra từ khóa liên quan đến giao hàng/vận chuyển
  if (messageLower.includes('giao hàng') || messageLower.includes('vận chuyển') || messageLower.includes('shipping') || messageLower.includes('giao nhanh') || messageLower.includes('phí ship')) {
    return fallbackResponses.shipping;
  }
  
  // Kiểm tra từ khóa liên quan đến thanh toán
  if (messageLower.includes('thanh toán') || messageLower.includes('payment') || messageLower.includes('trả tiền') || messageLower.includes('chuyển khoản') || messageLower.includes('thẻ tín dụng') || messageLower.includes('cod')) {
    return fallbackResponses.payment;
  }
  
  // Kiểm tra từ khóa liên quan đến chính sách đổi trả
  if (messageLower.includes('đổi trả') || messageLower.includes('hoàn tiền') || messageLower.includes('return') || messageLower.includes('hoa héo') || messageLower.includes('không tươi') || messageLower.includes('hư hỏng')) {
    return fallbackResponses.return;
  }
  
  // Kiểm tra từ khóa liên quan đến khuyến mãi/giảm giá
  if (messageLower.includes('giảm giá') || messageLower.includes('khuyến mãi') || messageLower.includes('discount') || messageLower.includes('sale') || messageLower.includes('ưu đãi') || messageLower.includes('voucher') || messageLower.includes('mã giảm giá')) {
    return fallbackResponses.discount;
  }
  
  // Kiểm tra từ khóa liên quan đến thông tin liên hệ
  if (messageLower.includes('liên hệ') || messageLower.includes('hotline') || messageLower.includes('email') || messageLower.includes('địa chỉ') || messageLower.includes('cửa hàng') || messageLower.includes('shop') || messageLower.includes('thông tin')) {
    return fallbackResponses.contact;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa hồng
  if (messageLower.includes('hoa hồng') || messageLower.includes('rose') || messageLower.includes('roses')) {
    return fallbackResponses.roses;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa ly
  if (messageLower.includes('hoa ly') || messageLower.includes('lily') || messageLower.includes('lilies')) {
    return fallbackResponses.lilies;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa lan
  if (messageLower.includes('hoa lan') || messageLower.includes('lan hồ điệp') || messageLower.includes('orchid')) {
    return fallbackResponses.orchids;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa sinh nhật
  if (messageLower.includes('sinh nhật') || messageLower.includes('birthday') || messageLower.includes('mừng tuổi')) {
    return fallbackResponses.birthday;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa cưới
  if (messageLower.includes('cưới') || messageLower.includes('đám cưới') || messageLower.includes('wedding') || messageLower.includes('kết hôn') || messageLower.includes('cô dâu') || messageLower.includes('chú rể')) {
    return fallbackResponses.wedding;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa chúc mừng
  if (messageLower.includes('chúc mừng') || messageLower.includes('khai trương') || messageLower.includes('tốt nghiệp') || messageLower.includes('congratulation') || messageLower.includes('thăng chức')) {
    return fallbackResponses.congratulation;
  }
  
  // Kiểm tra từ khóa liên quan đến hoa chia buồn
  if (messageLower.includes('chia buồn') || messageLower.includes('đám tang') || messageLower.includes('viếng') || messageLower.includes('condolence') || messageLower.includes('vòng hoa')) {
    return fallbackResponses.condolence;
  }
  
  // Kiểm tra từ khóa liên quan đến việc bảo quản hoa
  if (messageLower.includes('giữ tươi') || messageLower.includes('bảo quản') || messageLower.includes('tươi lâu') || messageLower.includes('preservation') || messageLower.includes('cách giữ')) {
    return fallbackResponses.preservation;
  }
  
  // Kiểm tra từ khóa liên quan đến dịch vụ tùy chỉnh
  if (messageLower.includes('đặt hàng') || messageLower.includes('yêu cầu riêng') || messageLower.includes('customize') || messageLower.includes('thiết kế') || messageLower.includes('theo yêu cầu')) {
    return fallbackResponses.custom;
  }
  
  // Kiểm tra từ khóa liên quan đến dịch vụ trang trí sự kiện
  if (messageLower.includes('sự kiện') || messageLower.includes('trang trí') || messageLower.includes('event') || messageLower.includes('tiệc') || messageLower.includes('party') || messageLower.includes('decor')) {
    return fallbackResponses.event;
  }
  
  // Kiểm tra từ khóa liên quan đến độ tươi của hoa
  if (messageLower.includes('hoa tươi') || messageLower.includes('tươi không') || messageLower.includes('fresh') || messageLower.includes('độ tươi')) {
    return fallbackResponses.freshness;
  }
  
  // Kiểm tra từ khóa liên quan đến danh mục sản phẩm/hoa
  if (messageLower.includes('sản phẩm') || 
      messageLower.includes('hàng') || 
      messageLower.includes('product') || 
      messageLower.includes('hoa gì') || 
      messageLower.includes('bán gì') || 
      messageLower.includes('có những') || 
      messageLower.includes('loại hoa') ||
      messageLower.includes('danh mục') ||
      messageLower.includes('có hoa') ||
      messageLower.includes('có loại') ||
      messageLower.includes('có danh mục') ||
      messageLower.includes('danh mục hoa') ||
      messageLower.includes('có những loại') ||
      messageLower.includes('có bán') ||
      messageLower.includes('catalog')) {
    return fallbackResponses.product;
  }
  
  // Mặc định nếu không tìm thấy từ khóa phù hợp
  return 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn ngay bây giờ. Nếu bạn có nhu cầu đặt hoa hoặc tìm hiểu thêm về dịch vụ của chúng tôi, vui lòng liên hệ qua Hotline: 0972.898.369 hoặc Email: tai.2274802010777@vanlanguni.vn. Đội ngũ florist chuyên nghiệp của chúng tôi sẽ sẵn lòng hỗ trợ bạn.';
};

// Hàm kiểm tra xem câu hỏi có liên quan đến website không
// Trả về true nếu câu hỏi liên quan, và false nếu không liên quan
const isRelevantQuestion = (message) => {
  const messageLower = message.toLowerCase();
  const irrelevantKeywords = [
    // Các từ khóa không liên quan đến website
    'chính trị', 'bầu cử', 'đảng', 'quân sự', 'chiến tranh',
    'thời tiết', 'dự báo', 'mưa', 'bão', 'áp thấp',
    'chứng khoán', 'cổ phiếu', 'bitcoin', 'crypto', 'tiền ảo',
    'tôn giáo', 'đạo phật', 'đạo chúa', 'nhà thờ', 'giáo hội',
    'scandal', 'drama', 'showbiz', 'cầu thủ', 'diễn viên'
  ];
  
  // Kiểm tra các từ khóa không liên quan
  for (const keyword of irrelevantKeywords) {
    if (messageLower.includes(keyword) && 
        !messageLower.includes('hoa') && 
        !messageLower.includes('cửa hàng') && 
        !messageLower.includes('shop') && 
        !messageLower.includes('giao')) {
      return false; // Trả về false nếu có chứa từ khóa không liên quan
    }
  }
  
  // Kiểm tra từ khóa liên quan đến website
  const relevantKeywords = [
    // Các loại hoa
    'hoa', 'bó hoa', 'giỏ hoa', 'hộp hoa', 'kệ hoa', 'hoa tươi', 'florist',
    'hoa hồng', 'hoa cúc', 'hoa ly', 'hoa lan', 'hoa tulip', 'lẵng hoa',
    'hướng dương', 'cẩm tú cầu', 'hoa baby', 'hoa đồng tiền', 'hoa cát tường',
    'hoa lily', 'hoa lan hồ điệp', 'hoa mẫu đơn', 'hoa sen', 'oải hương',
    'vòng hoa', 'hoa để bàn', 'hoa cắm lọ', 'hoa trang trí',
    
    // Dịp và sự kiện
    'sinh nhật', 'khai trương', 'cưới hỏi', 'chia buồn', 'chúc mừng', 'tốt nghiệp',
    'valentine', 'ngày phụ nữ', 'ngày nhà giáo', 'ngày 8/3', 'ngày 20/10', 'ngày 20/11',
    'lễ tình nhân', 'kỷ niệm', 'tình yêu', 'tỏ tình', 'cầu hôn', 'tang lễ',
    
    // Quà tặng kèm
    'quà tặng', 'gấu bông', 'socola', 'chocolate', 'bánh kem', 'rượu vang',
    'thiệp', 'thiệp chúc mừng', 'nước hoa', 'gift box', 'trái cây',
    
    // Vận chuyển và đặt hàng
    'đặt hàng', 'giao hàng', 'vận chuyển', 'ship', 'shipping', 'giao nhanh',
    'đặt trước', 'đặt online', 'đặt qua web', 'giao đến', 'delivery',
    
    // Thanh toán
    'thanh toán', 'payment', 'trả tiền', 'credit card', 'banking', 'cod',
    'chuyển khoản', 'thẻ tín dụng', 'ví điện tử', 'momo', 'zalopay',
    
    // Chính sách
    'đổi trả', 'hoàn tiền', 'chính sách', 'bảo hành', 'bảo đảm', 'cam kết',
    'tươi', 'độ tươi', 'tươi lâu', 'bảo quản', 'giữ hoa', 'warranty',
    
    // Giá cả và khuyến mãi
    'giá', 'giá cả', 'bảng giá', 'chi phí', 'giá bao nhiêu', 'price',
    'khuyến mãi', 'giảm giá', 'discount', 'sale', 'ưu đãi', 'voucher',
    'mã giảm giá', 'coupon', 'tặng', 'tích điểm', 'membership',
    
    // Liên hệ và thông tin shop
    'liên hệ', 'hotline', 'số điện thoại', 'phone', 'gọi', 'email',
    'địa chỉ', 'cửa hàng', 'shop', 'tiệm hoa', 'flower shop', 'store',
    'giờ mở cửa', 'giờ làm việc', 'opening hour', 'fanpage',
    
    // Dịch vụ bổ sung
    'thiết kế', 'trang trí', 'decor', 'sự kiện', 'event', 'tiệc', 'party',
    'workshop', 'dạy cắm hoa', 'lớp học', 'tư vấn'
  ];
  
  // Kiểm tra nếu có từ khóa liên quan
  for (const keyword of relevantKeywords) {
    if (messageLower.includes(keyword)) {
      return true; // Trả về true nếu có từ khóa liên quan
    }
  }
  
  // Nếu không chắc chắn, coi là liên quan
  return true;
};

// API endpoint xử lý các yêu cầu chat từ người dùng
// POST /api/chatgpt/chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body; // Lấy nội dung tin nhắn từ request body
    
    // Kiểm tra nếu thiếu nội dung tin nhắn
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu nội dung tin nhắn' 
      });
    }
    
    // Kiểm tra nếu câu hỏi không liên quan đến website
    if (!isRelevantQuestion(message)) {
      return res.json({
        success: true,
        reply: "Tôi chỉ có thể trả lời các câu hỏi liên quan đến website, sản phẩm và dịch vụ của chúng tôi. Vui lòng đặt câu hỏi liên quan đến cửa hàng."
      });
    }

    // Xử lý câu hỏi về model AI đang được sử dụng
    if (message.toLowerCase().includes('model') && 
        (message.toLowerCase().includes('ai') || message.toLowerCase().includes('chatgpt') || message.toLowerCase().includes('sử dụng'))) {
      const modelInfo = openai ? 'gpt-3.5-turbo' : 'Hệ thống phản hồi tự động';
      return res.json({
        success: true,
        reply: `Hiện tại, trợ lý AI của cửa hàng đang sử dụng model ${modelInfo} để xử lý các câu hỏi của khách hàng. Model này được thiết kế để cung cấp thông tin chính xác và hữu ích về các sản phẩm và dịch vụ của cửa hàng hoa chúng tôi.`
      });
    }

    // Kiểm tra yêu cầu về thông tin website hoặc thông tin tổng quát
    if (message.toLowerCase().includes('websiteinfo') || 
        message.toLowerCase().includes('thông tin website') || 
        message.toLowerCase().includes('giới thiệu website') ||
        message.toLowerCase().includes('thông tin về web')) {
      // Trả về thông tin website được định dạng từ biến websiteInfo
      const formattedWebsiteInfo = websiteInfo
        .replace(/\n\n/g, '\n')
        .replace(/^- /gm, '• ')
        .replace(/:/g, ':\n');
        
      return res.json({
        success: true,
        reply: formattedWebsiteInfo.trim()
      });
    }

    // Kiểm tra yêu cầu về thông tin cửa hàng
    if (message.toLowerCase().includes('website') || 
        message.toLowerCase().includes('thông tin') || 
        message.toLowerCase().includes('giới thiệu')) {
      // Trả về thông tin website được định dạng
      return res.json({
        success: true,
        reply: `THÔNG TIN VỀ SHOP HOA:

- Chúng tôi là cửa hàng chuyên bán hoa tươi và quà tặng với nhiều năm kinh nghiệm.
- Đội ngũ florist chuyên nghiệp luôn sẵn sàng tư vấn và thiết kế theo yêu cầu.
- Cam kết hoa tươi, giao hàng đúng hẹn và dịch vụ chăm sóc khách hàng tận tâm.

LIÊN HỆ:
- Hotline: 0972.898.369
- Email: tai.2274802010777@vanlanguni.vn
- Địa chỉ: 69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh`
      });
    }

    // Kiểm tra yêu cầu về danh mục hoa
    const flowerCategoryKeywords = [
      'danh mục hoa', 
      'loại hoa', 
      'có hoa gì', 
      'có danh mục',
      'có loại hoa',
      'bán hoa gì',
      'catalog',
      'có những loại',
      'có danh mục hoa nào',
      'danh mục'
    ];
    
    // Trả về danh mục hoa từ cơ sở dữ liệu nếu có yêu cầu
    if (flowerCategoryKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      try {
        // Lấy danh mục hoa từ database
        const categories = await CategoryDAO.selectAll();
        
        // Lấy thông tin về sản phẩm trong mỗi danh mục
        const productsInfo = {};
        for (const category of categories) {
          const products = await ProductDAO.selectByCategory(category._id);
          productsInfo[category._id] = products.length;
        }
        
        // Format danh mục hoa theo định dạng mong muốn
        const flowerTypes = categories.map(cat => cat.name).join(', ');
        
        // Trả về thông tin danh mục hoa
        return res.json({
          success: true,
          reply: `- Chúng tôi cung cấp các loại hoa tươi như ${flowerTypes}.

`
        });
      } catch (error) {
        console.error('Error fetching flower categories:', error);
        
        // Trong trường hợp lỗi, trả về phản hồi dự phòng
        return res.json({
          success: true,
          reply: fallbackResponses.product
        });
      }
    }

    // Nếu OpenAI không được khởi tạo hoặc API key không hợp lệ, sử dụng phản hồi dự phòng
    if (!openai) {
      console.log('Using fallback response system');
      const fallbackReply = findFallbackResponse(message);
      return res.json({
        success: true,
        reply: fallbackReply
      });
    }

    // Sử dụng OpenAI API nếu khả dụng
    try {
      // Gọi API ChatGPT để lấy phản hồi
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Sử dụng model gpt-3.5-turbo
        messages: [
          { 
            role: "system", // Tin nhắn hệ thống để định hướng AI
            content: `Bạn là trợ lý AI cho website thương mại điện tử này. Dưới đây là thông tin chi tiết về website:
            
            ${websiteInfo}
            
            HƯỚNG DẪN QUAN TRỌNG:
            
            - CHỈ trả lời những câu hỏi liên quan đến thông tin về website, sản phẩm, chính sách và dịch vụ của website này.
            
            - Nếu người dùng hỏi về bất kỳ chủ đề nào không liên quan đến website này như tin tức, thời tiết, chính trị, thể thao,
            hoặc bất kỳ thông tin cá nhân nào, hãy trả lời: "Tôi chỉ có thể trả lời các câu hỏi liên quan đến 
            website, sản phẩm và dịch vụ của chúng tôi. Vui lòng đặt câu hỏi liên quan đến cửa hàng."
            
            - Trả lời ngắn gọn, rõ ràng, thân thiện và hữu ích.
            
            - Không bao giờ bịa ra thông tin không có trong phần thông tin website ở trên.
            
            - Nếu không biết câu trả lời chính xác, hãy khuyên người dùng liên hệ hotline hoặc email của cửa hàng.
            
            - QUAN TRỌNG: Định dạng câu trả lời của bạn một cách dễ đọc và rõ ràng:
              + Sử dụng dấu xuống dòng (\\n) để phân tách các phần thông tin
              + Sử dụng dấu gạch đầu dòng (-) nếu liệt kê nhiều mục
              + Đặt thông tin quan trọng đầu tiên
              + Hãy định dạng câu trả lời giống cách con người nói chuyện, thân thiện
              + Nếu trả lời về thông tin liên hệ, hãy định dạng rõ ràng theo dạng danh sách`
          },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return res.json({ 
        success: true, 
        reply: completion.choices[0].message.content 
      });
      
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Nếu lỗi OpenAI, sử dụng phản hồi dự phòng
      const fallbackReply = findFallbackResponse(message);
      return res.json({
        success: true,
        reply: fallbackReply
      });
    }
    
  } catch (error) {
    console.error('Lỗi ChatGPT:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu' 
    });
  }
});

// Endpoint để lấy thông tin website
router.get('/website-info', (req, res) => {
  res.json({ 
    success: true,
    info: websiteInfo
  });
});

module.exports = router; 