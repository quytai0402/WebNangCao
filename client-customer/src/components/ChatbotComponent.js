import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/ChatbotComponent.css';
import { FaRobot, FaUser, FaPaperPlane, FaTimes } from 'react-icons/fa';

const ChatbotComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      content: 'Xin chào! Tôi là trợ lý ảo của cửa hàng hoa. Tôi có thể giúp bạn tìm bó hoa phù hợp, tư vấn chọn hoa theo dịp, báo giá, thông tin giao hàng hoặc bất kỳ câu hỏi nào về dịch vụ của chúng tôi.\n\nBạn đang tìm kiếm loại hoa nào hoặc có câu hỏi gì về cửa hàng ạ?' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll xuống khi có tin nhắn mới
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Lắng nghe sự kiện từ HTML
  useEffect(() => {
    const handleChatbotMessage = (event) => {
      if (event.data) {
        if (event.data.type === 'TOGGLE_CHATBOT') {
          // Toggle chatbot window
          setIsOpen(prevState => !prevState);
        }
      }
    };
    
    window.addEventListener('message', handleChatbotMessage);
    
    return () => {
      window.removeEventListener('message', handleChatbotMessage);
    };
  }, []);
  
  // Cập nhật trạng thái của cửa sổ chat
  useEffect(() => {
    // Thông báo trạng thái thay đổi
    window.postMessage(
      { type: 'CHATBOT_STATE_CHANGE', isOpen: isOpen },
      window.location.origin
    );
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (inputMessage.trim() === '') return;
    
    // Thêm tin nhắn của người dùng vào danh sách
    const userMessage = { type: 'user', content: inputMessage };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    try {
      // Gọi API ChatGPT để lấy câu trả lời trực tiếp từ backend
      const response = await axios.post('/api/chatgpt/chat', 
        { message: inputMessage },
        { timeout: 30000 }
      );
      
      if (response.data && response.data.success) {
        // Hiển thị câu trả lời từ backend mà không xử lý thêm
        const botMessage = { type: 'bot', content: response.data.reply };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        console.error('API error:', response.data);
        const botMessage = { 
          type: 'bot', 
          content: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.' 
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const botMessage = { 
        type: 'bot', 
        content: 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline.' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  // Hiển thị tin nhắn với định dạng chính xác như từ backend
  const renderMessageContent = (content) => {
    return content.split('\n').map((text, i, array) => (
      <React.Fragment key={i}>
        {text}
        {i < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="chatbot-container">
      {/* Chat window - chỉ hiển thị khi isOpen = true */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <FaRobot className="chatbot-icon" />
            <h3>Trợ lý ảo</h3>
            <button className="close-button" onClick={toggleChat} aria-label="Đóng">
              <FaTimes />
            </button>
          </div>
          
          <div className="chatbot-messages" ref={chatContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}-message`}>
                <div className="message-content">
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="loading-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>
          
          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || inputMessage.trim() === ''}
              aria-label="Gửi tin nhắn"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotComponent; 