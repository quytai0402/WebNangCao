import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebookF, FaInstagram, FaTwitter, FaPinterestP, FaYoutube,
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaHeart,
  FaLeaf, FaSeedling, FaArrowRight
} from 'react-icons/fa';
import MyContext from '../contexts/MyContext';
import '../styles/FooterComponent.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const context = useContext(MyContext);
  const { token } = context;

  // Handle newsletter subscription
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your newsletter subscription logic here
    alert(`Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin đến: ${email}`);
    setEmail('');
  };

  // Custom link component that scrolls to top when clicked
  const ScrollToTopLink = ({ to, children, className }) => {
    const handleClick = () => {
      // First scroll to top
      window.scrollTo(0, 0);
    };

    return (
      <Link to={to} onClick={handleClick} className={className}>
        {children}
      </Link>
    );
  };

  return (
    <>
      <footer className="flower-footer">
        <div className="footer-waves">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="wave-fill"></path>
          </svg>
        </div>
      
        <div className="footer-content container">
          <div className="footer-sections">
            <div className="footer-row">
              <div className="footer-col about-col">
                <div className="footer-logo">
                  <FaLeaf className="footer-logo-icon" />
                  <span>Florista</span>
                </div>
                <p className="footer-about-text">
                  Chuyên cung cấp những bó hoa tươi đẹp nhất, được chăm sóc tỉ mỉ và sáng tạo độc đáo để mang đến niềm vui và hạnh phúc cho mọi người.
                </p>
                <div className="footer-social">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon facebook">
                    <FaFacebookF />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                    <FaInstagram />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon twitter">
                    <FaTwitter />
                  </a>
                  <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="social-icon pinterest">
                    <FaPinterestP />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
                    <FaYoutube />
                  </a>
                </div>
              </div>

              <div className="footer-col links-col">
                <h3 className="footer-title">Danh Mục</h3>
                <ul className="footer-links">
                  <li><ScrollToTopLink to="/"><FaSeedling className="footer-link-icon" /> Trang chủ</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/products"><FaSeedling className="footer-link-icon" /> Sản phẩm</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/#"><FaSeedling className="footer-link-icon" /> Khuyến mãi</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/#"><FaSeedling className="footer-link-icon" /> Về chúng tôi</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/#"><FaSeedling className="footer-link-icon" /> Liên hệ</ScrollToTopLink></li>
                </ul>
              </div>

              <div className="footer-col links-col">
                <h3 className="footer-title">Tài Khoản</h3>
                <ul className="footer-links">
                  {!token ? (
                    <>
                      <li><ScrollToTopLink to="/login"><FaSeedling className="footer-link-icon" /> Đăng nhập</ScrollToTopLink></li>
                      <li><ScrollToTopLink to="/register"><FaSeedling className="footer-link-icon" /> Đăng ký</ScrollToTopLink></li>
                    </>
                  ) : (
                    <li><ScrollToTopLink to="/login"><FaSeedling className="footer-link-icon" /> Đăng nhập</ScrollToTopLink></li>
                  )}
                  <li><ScrollToTopLink to="/my-profile"><FaSeedling className="footer-link-icon" /> Tài khoản của tôi</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/myorders"><FaSeedling className="footer-link-icon" /> Đơn hàng của tôi</ScrollToTopLink></li>
                  <li><ScrollToTopLink to="/wishlist"><FaSeedling className="footer-link-icon" /> Danh sách yêu thích</ScrollToTopLink></li>
                </ul>
              </div>

              <div className="footer-col contact-col">
                <h3 className="footer-title">Liên Hệ Với Chúng Tôi</h3>
                <ul className="footer-contact-info">
                  <li>
                    <FaMapMarkerAlt className="footer-contact-icon" />
                    <span>69/68 Đ. Đặng Thuỳ Trâm, Phường 13, Bình Thạnh, Hồ Chí Minh 70000</span>
                  </li>
                  <li>
                    <FaPhoneAlt className="footer-contact-icon" />
                    <span>0972 898 369</span>
                  </li>
                  <li>
                    <FaEnvelope className="footer-contact-icon" />
                    <span>tranquytai0402@gmail.com</span>
                  </li>
                  <li>
                    <FaClock className="footer-contact-icon" />
                    <span>8:00 - 20:00, Thứ Hai - Chủ Nhật</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-content">
              <h3 className="newsletter-title">Đăng Ký Nhận Thông Tin</h3>
              <p className="newsletter-text">Đăng ký để nhận thông tin về sản phẩm mới và khuyến mãi hấp dẫn</p>
              <form onSubmit={handleSubmit} className="newsletter-form">
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn"
                    required
                  />
                  <button type="submit" className="newsletter-button">
                    <span>Đăng ký</span>
                    <FaArrowRight className="newsletter-button-icon" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p>© {new Date().getFullYear()} Florista. Đã đăng ký bản quyền</p>
            {/* <div className="footer-payment-methods">
              <img src="/images/payment-visa.png" alt="Visa" />
              <img src="/images/payment-mastercard.png" alt="Mastercard" />
              <img src="/images/payment-paypal.png" alt="PayPal" />
              <img src="/images/payment-momo.png" alt="MoMo" />
              <img src="/images/payment-zalopay.png" alt="ZaloPay" />
            </div> */}
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer; 