import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import MyContext from '../contexts/MyContext';
import { toast } from 'react-toastify';
import { Card, Button, Form, Modal, Table, Badge, Pagination, Spinner, Row, Col } from 'react-bootstrap';
import { formatDate } from './formatters';
import { 
  FaReply, FaTrash, FaStar, FaUser, FaSearch, FaEye, FaComment,
  FaFlower, FaLeaf, FaHeart, FaRegHeart, FaComments
} from 'react-icons/fa';
import { GiFlowerPot, GiFlowerEmblem, GiRose } from 'react-icons/gi';
import '../styles/CommentComponent.css';

// Custom CSS for product links
const productLinkStyle = {
  color: '#ff758c',
  textDecoration: 'none',
  fontWeight: '500',
  transition: 'all 0.2s'
};

const CommentComponent = () => {
  const context = useContext(MyContext);
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState([]);
  
  // State for viewing replies
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [commentReplies, setCommentReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [commentWithReplies, setCommentWithReplies] = useState(null);

  // State variables for action loading states
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Lấy danh sách bình luận
  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${context.apiUrl}/admin/comments?page=${pagination.page}&limit=${pagination.limit}`,
        { 
          headers: { 'Authorization': `Bearer ${context.token}` },
          timeout: 10000 // Thêm timeout để tránh chờ quá lâu
        }
      );
      
      if (response.data && response.data.success) {
        // Kiểm tra và thiết lập dữ liệu với giá trị mặc định nếu cần
        setComments(response.data.data?.comments || []);
        setFilteredComments(response.data.data?.comments || []);
        setPagination(prev => ({
          ...prev,
          ...(response.data.data?.pagination || {}),
          total: response.data.data?.pagination?.total || 0,
          pages: response.data.data?.pagination?.pages || 1
        }));
      } else {
        console.error('Error in response:', response.data);
        toast.error(response.data?.message || 'Không thể tải danh sách bình luận');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Lỗi từ máy chủ với mã trạng thái
        const status = error.response.status;
        if (status === 401) {
          toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');
          // Có thể thêm xử lý đăng xuất ở đây nếu cần
          context.setToken('');
          context.setUser(null);
        } else if (status === 403) {
          toast.error('Bạn không có quyền truy cập danh sách bình luận');
        } else {
          toast.error(`Lỗi ${status}: ${error.response.data?.message || 'Không thể tải bình luận'}`);
        }
      } else if (error.request) {
        // Lỗi không nhận được phản hồi từ máy chủ
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else if (error.code === 'ECONNABORTED') {
        // Lỗi timeout
        toast.error('Quá thời gian kết nối. Vui lòng thử lại sau.');
      } else {
        // Lỗi khác
        toast.error('Không thể tải danh sách bình luận: ' + (error.message || 'Lỗi không xác định'));
      }
      
      // Thiết lập dữ liệu rỗng trong trường hợp lỗi
      setComments([]);
      setFilteredComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách sản phẩm để lọc
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${context.apiUrl}/admin/products`,
        { 
          headers: { 'Authorization': `Bearer ${context.token}` },
          timeout: 8000
        }
      );
      
      if (response.data && response.data.success) {
        // Extract products from the response based on the actual API response structure
        setProducts(response.data.products || []);
      } else {
        // Set empty array as fallback
        setProducts([]);
        toast.warning('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Set empty array on error
      setProducts([]);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');
          context.setToken('');
        } else {
          toast.error(`Lỗi ${status}: ${error.response.data?.message || 'Không thể tải sản phẩm'}`);
        }
      } else if (error.request) {
        toast.error('Không thể kết nối đến máy chủ');
      } else {
        toast.error('Lỗi khi tải sản phẩm: ' + error.message);
      }
    }
  };

  // Lấy danh sách trả lời của một bình luận
  const fetchRepliesForComment = async (commentId) => {
    setLoadingReplies(true);
    setCommentReplies([]); // Clear current replies while loading
    
    try {
      const response = await axios.get(
        `${context.apiUrl}/admin/comments/replies/${commentId}`,
        { 
          headers: { 'Authorization': `Bearer ${context.token}` },
          timeout: 8000
        }
      );
      
      if (response.data && response.data.success) {
        // Corrected path to the replies data
        setCommentReplies(response.data.data?.replies || []);
      } else {
        toast.error(response.data?.message || 'Không thể tải danh sách trả lời');
        setCommentReplies([]);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      
      // Better error handling with more specific messages
      if (error.response) {
        // Handle specific HTTP error codes
        if (error.response.status === 404) {
          toast.error('Không tìm thấy bình luận hoặc bình luận đã bị xóa');
          handleCloseRepliesModal(); // Close the modal if the comment doesn't exist
        } else {
          toast.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Không thể tải danh sách trả lời'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Hết thời gian kết nối. Vui lòng thử lại sau.');
      } else {
        toast.error('Không thể tải danh sách trả lời: ' + (error.message || 'Lỗi không xác định'));
      }
      
      setCommentReplies([]);
    } finally {
      // Short delay before hiding loading indicator for better UX
      setTimeout(() => {
        setLoadingReplies(false);
      }, 300);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchProducts();
  }, [pagination.page, context.token]);

  // Lọc bình luận theo tìm kiếm
  useEffect(() => {
    if (searchTerm.trim() === '' && selectedProduct === '') {
      setFilteredComments(comments);
      return;
    }
    
    const filtered = comments.filter(comment => {
      const matchesSearch = 
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comment.customer && comment.customer.name && 
          comment.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProduct = selectedProduct === '' || 
        (comment.product && comment.product._id === selectedProduct);
      
      return matchesSearch && matchesProduct;
    });
    
    setFilteredComments(filtered);
  }, [searchTerm, selectedProduct, comments]);

  // Xử lý phân trang
  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
  };

  // Mở modal trả lời
  const handleOpenReplyModal = (comment) => {
    setSelectedComment(comment);
    setReplyContent('');
    setShowModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedComment(null);
    setReplyContent('');
  };

  // Mở modal xem trả lời
  const handleOpenRepliesModal = async (comment) => {
    setCommentWithReplies(comment);
    setShowRepliesModal(true);
    setReplyContent(''); // Clear any previous reply content
    await fetchRepliesForComment(comment._id);
  };

  // Đóng modal xem trả lời
  const handleCloseRepliesModal = () => {
    setShowRepliesModal(false);
    setCommentWithReplies(null);
    setCommentReplies([]);
    setReplyContent('');
  };

  // Xử lý gửi trả lời
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }
    
    try {
      const targetCommentId = selectedComment ? selectedComment._id : commentWithReplies._id;
      
      // Simple reply to parent comment
      const requestData = { content: replyContent };
      
      const response = await axios.post(
        `${context.apiUrl}/admin/comments/reply/${targetCommentId}`,
        requestData,
        { headers: { 'Authorization': `Bearer ${context.token}` } }
      );
      
      if (response.data.success) {
        toast.success('Đã trả lời bình luận thành công');
        
        // Reset content
        setReplyContent('');
        
        // Close the appropriate modal and refresh data
        if (showModal) {
          handleCloseModal();
        }
        
        if (showRepliesModal) {
          // Re-fetch the replies for the current comment
          await fetchRepliesForComment(commentWithReplies._id);
        }
        
        // Reload all comments to reflect the changes
        fetchComments();
      } else {
        toast.error(response.data.message || 'Không thể trả lời bình luận');
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      if (error.response) {
        toast.error(`Lỗi ${error.response.status}: ${error.response.data?.message || 'Không thể trả lời bình luận'}`);
      } else {
        toast.error('Không thể trả lời bình luận: ' + (error.message || 'Lỗi không xác định'));
      }
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }
    
    try {
      // Set the current comment as deleting
      setDeletingCommentId(commentId);
      
      // Show loading indicator
      toast.info('Đang xóa bình luận...');
      
      const response = await axios.delete(
        `${context.apiUrl}/admin/comments/${commentId}`,
        { 
          headers: { 'Authorization': `Bearer ${context.token}` },
          timeout: 8000 
        }
      );
      
      if (response.data.success) {
        // Show appropriate success message
        toast.success(response.data.message || 'Đã xóa bình luận thành công');
        
        // If we're in the replies modal, update the replies list
        if (showRepliesModal && commentWithReplies) {
          // If we're deleting the parent comment of the modal, close it
          if (commentId === commentWithReplies._id) {
            handleCloseRepliesModal();
          } 
          // If we're deleting a comment that's a reply to the current comment
          else if (response.data.data?.parentId && response.data.data.parentId === commentWithReplies._id) {
            await fetchRepliesForComment(commentWithReplies._id);
          }
          // If we're deleting a nested reply
          else {
            await fetchRepliesForComment(commentWithReplies._id);
          }
        }
        
        // Reload all comments to reflect the changes
        fetchComments();
      } else {
        toast.error(response.data.message || 'Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      if (error.response) {
        const status = error.response.status;
        const errorCode = error.response.data?.error;
        
        if (status === 401) {
          toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');
          context.setToken('');
          context.setUser(null);
        } else if (status === 404 || errorCode === 'COMMENT_NOT_FOUND') {
          toast.error('Bình luận không tồn tại hoặc đã bị xóa');
          
          // If a comment is not found, refresh the list
          if (showRepliesModal && commentWithReplies) {
            await fetchRepliesForComment(commentWithReplies._id);
          }
          fetchComments();
        } else {
          toast.error(`Lỗi ${status}: ${error.response.data?.message || 'Không thể xóa bình luận'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Hết thời gian kết nối. Vui lòng thử lại');
      } else {
        toast.error('Không thể xóa bình luận: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      // Reset the deleting state
      setDeletingCommentId(null);
    }
  };

  // Render số sao đánh giá
  const renderStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          color={i < rating ? '#ff758c' : '#e4e5e9'} 
          style={{ marginRight: '2px' }}
        />
      );
    }
    
    return (
      <div className="d-flex align-items-center">
        {stars}
        <span className="ms-1">({rating})</span>
      </div>
    );
  };

  // Render badge cho bình luận của admin
  const renderUserBadge = (customer) => {
    if (customer && customer.username === 'admin') {
      return <Badge bg="danger" className="ms-2">QTV</Badge>;
    }
    return null;
  };

  // Render phân trang
  const renderPagination = () => {
    const pages = [];
    const { page, pages: totalPages } = pagination;
    
    // Hiển thị tối đa 5 trang
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Nút Previous
    pages.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
      />
    );
    
    // Trang đầu tiên
    if (startPage > 1) {
      pages.push(
        <Pagination.Item 
          key={1} 
          active={page === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );
      
      if (startPage > 2) {
        pages.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // Các trang giữa
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item 
          key={i} 
          active={page === i}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Trang cuối cùng
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      
      pages.push(
        <Pagination.Item 
          key={totalPages} 
          active={page === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Nút Next
    pages.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
      />
    );
    
    return <Pagination>{pages}</Pagination>;
  };

  // Function to generate customer-facing product URL
  const getCustomerProductUrl = (productId) => {
    return `http://localhost:3002/product/${productId}`;
  };

  // Format @mentions in the content - Keep this for rendering existing mentions
  const formatCommentContent = (content) => {
    if (!content) return '';
    
    // Replace @username with styled span
    return content.replace(/@([a-zA-Z0-9_đàáạãèéẹêềếệìíịòóọõùúụưừứựỳỵýĐÀÁẠÃÈÉẸÊỀẾỆÌÍỊÒÓỌÕÙÚỤƯỪỨỰỲỴÝ\s]+)/g, 
      '<span class="mention-tag">@$1</span>');
  };

  const renderCommentContent = (content) => {
    return <div dangerouslySetInnerHTML={{ __html: formatCommentContent(content) }} />;
  };

  // Find direct parent for a reply (for nested visualization)
  const findParentReply = (reply) => {
    if (!reply || !reply.parentId || reply.parentId === commentWithReplies?._id) {
      return null; // This is a direct reply to the main comment
    }
    
    return commentReplies.find(r => r._id === reply.parentId);
  };

  // Group replies by parent for nested display
  const getReplyGroups = () => {
    if (!commentReplies || !commentReplies.length) return [];
    
    // First get direct replies to the main comment
    const directReplies = commentReplies.filter(reply => 
      reply.parentId === commentWithReplies?._id
    );
    
    // Then get nested replies
    const nestedReplies = commentReplies.filter(reply => 
      reply.parentId !== commentWithReplies?._id
    );
    
    // Create the grouped structure
    const groups = [...directReplies];
    
    // Add each nested reply under its parent
    nestedReplies.forEach(nestedReply => {
      const parentIndex = groups.findIndex(reply => reply._id === nestedReply.parentId);
      if (parentIndex !== -1) {
        if (!groups[parentIndex].childReplies) {
          groups[parentIndex].childReplies = [];
        }
        groups[parentIndex].childReplies.push(nestedReply);
      } else {
        // If we can't find parent, just add it to the main list
        groups.push(nestedReply);
      }
    });
    
    return groups;
  };

  return (
    <div className="comment-management p-4">
      <Card className="comment-card mb-4">
        <Card.Header className="comment-header">
          <h4 className="mb-0">
            <div className="flower-icon-container float-icon">
              <GiFlowerPot />
            </div>
            Quản lý bình luận và đánh giá
          </h4>
          <div className="flower-decoration flower-decoration-1">🌸</div>
          <div className="flower-decoration flower-decoration-2">🌷</div>
        </Card.Header>
        <Card.Body>
          <div className="filter-container">
            <Row className="mb-4">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label className="fw-medium text-muted mb-2">
                    <FaSearch className="me-2" />
                    Tìm kiếm bình luận
                  </Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Tìm theo nội dung hoặc tên người dùng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: '8px 0 0 8px' }}
                    />
                    <Button 
                      variant="light" 
                      onClick={() => setSearchTerm('')}
                      className="border"
                      style={{ borderRadius: '0 8px 8px 0' }}
                      disabled={!searchTerm}
                    >
                      <FaTrash className="text-muted" size={12} />
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium text-muted mb-2">
                    <GiRose className="me-2" />
                    Lọc theo sản phẩm
                  </Form.Label>
                  <Form.Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="">Tất cả sản phẩm</option>
                    {Array.isArray(products) && products.length > 0 ? (
                      products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Không có sản phẩm</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#ff758c' }} />
              <p className="mt-3 text-muted">Đang tải bình luận...</p>
            </div>
          ) : (
            <>
              <Table responsive hover className="comment-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Sản phẩm</th>
                    <th>Đánh giá</th>
                    <th style={{ minWidth: '300px' }}>Nội dung</th>
                    <th>Ngày bình luận</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.length > 0 ? (
                    // Filter to only show parent comments (no parentId)
                    filteredComments.filter(comment => !comment.parentId).map(comment => {
                      // Check if this comment has any replies
                      const hasReplies = filteredComments.some(reply => reply.parentId === comment._id);
                      
                      return (
                        <tr key={comment._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div style={{ 
                                width: '35px', 
                                height: '35px',
                                borderRadius: '50%',
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                color: '#ff758c'
                              }}>
                                <FaUser />
                              </div>
                              <div>
                                <div className="fw-medium">{comment.customer?.name || 'Người dùng ẩn danh'}</div>
                                <div className="d-flex align-items-center">
                                  {renderUserBadge(comment.customer)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {comment.product ? (
                              <a 
                                href={getCustomerProductUrl(comment.product._id)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="product-link"
                                title="Xem chi tiết sản phẩm (trang khách hàng)"
                              >
                                                              {comment.product.name || 'Sản phẩm không xác định'}
                              </a>
                            ) : (
                              <span className="text-muted">Sản phẩm không xác định</span>
                            )}
                          </td>
                          <td>
                            {comment.rating ? (
                              <div className="rating-display">
                                {renderStars(comment.rating)}
                              </div>
                            ) : (
                              <span className="text-muted fst-italic">Không có đánh giá</span>
                            )}
                          </td>
                          <td>
                            <div className="comment-content-wrapper">
                              {renderCommentContent(comment.content)}
                              {hasReplies && (
                                <Badge bg="light" text="dark" className="reply-badge mt-2">
                                  <FaComment className="me-1" size={10} />
                                  Có phản hồi
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="date-display">
                              <div className="fw-medium text-nowrap">{formatDate(comment.createdAt)}</div>
                              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                                <div className="text-muted small">
                                  <em>Đã chỉnh sửa: {formatDate(comment.updatedAt)}</em>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column flex-md-row action-buttons gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="action-button reply-btn"
                                onClick={() => handleOpenReplyModal(comment)}
                                title="Trả lời bình luận này"
                              >
                                <FaReply className="me-1" /> Trả lời
                              </Button>
                              
                              {hasReplies && (
                                <Button 
                                  variant="outline-info" 
                                  size="sm" 
                                  className="action-button view-replies-btn"
                                  onClick={() => handleOpenRepliesModal(comment)}
                                  title="Xem các phản hồi cho bình luận này"
                                >
                                  <FaComments className="me-1" /> Xem phản hồi
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="action-button delete-btn"
                                onClick={() => handleDeleteComment(comment._id)}
                                disabled={deletingCommentId === comment._id}
                                title="Xóa bình luận này"
                              >
                                {deletingCommentId === comment._id ? (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                      className="me-1"
                                    />
                                    <span>Đang xóa...</span>
                                  </>
                                ) : (
                                  <>
                                    <FaTrash className="me-1" /> Xóa
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="empty-comments-container">
                          <div className="empty-icon-wrapper">
                            <FaComment size={30} className="text-muted mb-3" />
                          </div>
                          <h5 className="text-muted">Không có bình luận nào</h5>
                          <p className="text-muted mb-0">
                            {searchTerm || selectedProduct ? 
                              'Không tìm thấy bình luận phù hợp với bộ lọc. Hãy thử với các tiêu chí khác.' : 
                              'Chưa có bình luận nào được tạo hoặc tất cả đã bị xóa.'}
                          </p>
                          <div className="flower-decoration empty-flower-1">
                            <GiFlowerEmblem size={20} style={{ opacity: 0.4, color: '#ff758c' }} />
                          </div>
                          <div className="flower-decoration empty-flower-2">
                            <GiFlowerEmblem size={20} style={{ opacity: 0.4, color: '#ff758c' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Phân trang */}
              {filteredComments.length > 0 && (
                <div className="pagination-container d-flex justify-content-between align-items-center flex-wrap mt-4">
                  <div className="page-info text-muted small">
                    <GiRose className="me-1" /> Hiển thị {filteredComments.length} / {pagination.total} bình luận
                  </div>
                  <div className="flower-pagination">
                    {renderPagination()}
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal trả lời bình luận */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        className="comment-reply-modal"
      >
        <Modal.Header closeButton className="reply-modal-header">
          <Modal.Title>
            <GiFlowerPot className="me-2" style={{ color: '#ff758c' }} />
            Trả lời bình luận
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="reply-modal-body">
          {selectedComment && (
            <Card className="original-comment-card mb-3 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex mb-2 align-items-center">
                  <div className="user-avatar me-2">
                    <FaUser size={14} />
                  </div>
                  <span className="fw-medium">
                    {selectedComment.customer?.name || 'Người dùng ẩn danh'}
                    {renderUserBadge(selectedComment.customer)}
                  </span>
                </div>
                <div className="original-comment-content">
                  {renderCommentContent(selectedComment.content)}
                </div>
                <div className="original-comment-meta text-muted small mt-2">
                  {formatDate(selectedComment.createdAt)}
                  {selectedComment.rating && (
                    <div className="mt-1">{renderStars(selectedComment.rating)}</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          <Form onSubmit={handleSubmitReply}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                <FaReply className="me-1" /> Nội dung trả lời
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập nội dung phản hồi cho bình luận này..."
                className="reply-textarea"
              />
            </Form.Group>
            <div className="text-end">
              <Button 
                variant="outline-secondary" 
                onClick={handleCloseModal}
                className="me-2 cancel-btn"
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                className="submit-reply-btn"
                disabled={!replyContent.trim()}
              >
                <FaReply className="me-1" /> Gửi trả lời
              </Button>
            </div>
          </Form>
          <div className="flower-decoration modal-flower-1">🌸</div>
          <div className="flower-decoration modal-flower-2">🌷</div>
        </Modal.Body>
      </Modal>

      {/* Modal xem các trả lời */}
      <Modal
        show={showRepliesModal}
        onHide={handleCloseRepliesModal}
        size="lg"
        centered
        className="replies-modal"
      >
        <Modal.Header closeButton className="replies-modal-header">
          <Modal.Title>
            <FaComments className="me-2" style={{ color: '#ff758c' }} />
            Các phản hồi cho bình luận
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="replies-modal-body">
          {commentWithReplies && (
            <Card className="original-comment-card mb-4 border-0">
              <Card.Body className="p-3 bg-light rounded">
                <div className="d-flex mb-2 align-items-center">
                  <div className="user-avatar-container me-2">
                    <div className="user-avatar">
                      <FaUser />
                    </div>
                  </div>
                  <div>
                    <span className="fw-medium">
                      {commentWithReplies.customer?.name || 'Người dùng ẩn danh'}
                      {renderUserBadge(commentWithReplies.customer)}
                    </span>
                    <div className="text-muted small">
                      {formatDate(commentWithReplies.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="original-comment-content my-2">
                  {renderCommentContent(commentWithReplies.content)}
                </div>
                {commentWithReplies.rating && (
                  <div className="mt-2">
                    {renderStars(commentWithReplies.rating)}
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {loadingReplies ? (
            <div className="text-center py-4">
              <Spinner animation="border" style={{ color: '#ff758c' }} />
              <p className="mt-3 text-muted">Đang tải phản hồi...</p>
            </div>
          ) : (
            <>
              <h6 className="replies-heading mb-3">
                <span className="replies-count-badge">
                  {commentReplies.length}
                </span> Phản hồi
              </h6>

              <div className="replies-container">
                {commentReplies.length > 0 ? (
                  getReplyGroups().map((reply) => (
                    <div key={reply._id} className="reply-thread">
                      <Card className="reply-card mb-3">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="reply-header d-flex align-items-center">
                              <div className="user-avatar-container me-2">
                                <div className="user-avatar reply-avatar">
                                  <FaUser />
                                </div>
                              </div>
                              <div>
                                <div className="d-flex align-items-center">
                                  <span className="fw-medium">
                                    {reply.admin ? reply.admin.name : (reply.customer?.name || 'Người dùng ẩn danh')}
                                  </span>
                                  {reply.admin ? (
                                    <Badge bg="primary" className="ms-2">QTV</Badge>
                                  ) : (
                                    renderUserBadge(reply.customer)
                                  )}
                                </div>
                                <div className="text-muted small">
                                  {formatDate(reply.createdAt)}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="delete-reply-btn"
                              onClick={() => handleDeleteComment(reply._id)}
                              disabled={deletingCommentId === reply._id}
                            >
                              {deletingCommentId === reply._id ? (
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                />
                              ) : (
                                <FaTrash />
                              )}
                            </Button>
                          </div>
                          <div className="reply-content mt-2">
                            {renderCommentContent(reply.content)}
                          </div>
                          
                          {/* Render nested replies if any */}
                          {reply.childReplies && reply.childReplies.length > 0 && (
                            <div className="nested-replies mt-3 ms-4 ps-2 border-start">
                              {reply.childReplies.map(childReply => (
                                <Card key={childReply._id} className="nested-reply-card mb-2 border-0 bg-light">
                                  <Card.Body className="py-2 px-3">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="reply-header d-flex align-items-center">
                                        <div className="user-avatar-container me-2">
                                          <div className="user-avatar nested-reply-avatar">
                                            <FaUser size={12} />
                                          </div>
                                        </div>
                                        <div>
                                          <div className="d-flex align-items-center">
                                            <span className="fw-medium">
                                              {childReply.admin ? childReply.admin.name : (childReply.customer?.name || 'Người dùng ẩn danh')}
                                            </span>
                                            {childReply.admin ? (
                                              <Badge bg="primary" className="ms-2" style={{ fontSize: '0.7rem' }}>QTV</Badge>
                                            ) : (
                                              renderUserBadge(childReply.customer)
                                            )}
                                          </div>
                                          <div className="text-muted small">
                                            {formatDate(childReply.createdAt)}
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="delete-reply-btn btn-sm"
                                        onClick={() => handleDeleteComment(childReply._id)}
                                        disabled={deletingCommentId === childReply._id}
                                      >
                                        {deletingCommentId === childReply._id ? (
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <FaTrash size={12} />
                                        )}
                                      </Button>
                                    </div>
                                    <div className="reply-content mt-2">
                                      {renderCommentContent(childReply.content)}
                                    </div>
                                  </Card.Body>
                                </Card>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="no-replies text-center py-4">
                    <GiRose size={30} style={{ color: '#ff758c', opacity: 0.7 }} />
                    <p className="mt-3 mb-0">Chưa có phản hồi nào cho bình luận này</p>
                  </div>
                )}
              </div>

              {/* Form trả lời */}
              <Card className="reply-form-card mt-4 border-0 bg-light">
                <Card.Body className="p-3">
                  <Form onSubmit={handleSubmitReply}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">
                        <FaReply className="me-1" /> Thêm phản hồi của bạn
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        className="reply-textarea"
                      />
                    </Form.Group>
                    <div className="text-end">
                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="submit-reply-btn"
                        disabled={!replyContent.trim()}
                      >
                        <FaReply className="me-1" /> Gửi phản hồi
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </>
          )}
          <div className="flower-decoration modal-flower-replies-1">🌸</div>
          <div className="flower-decoration modal-flower-replies-2">🌷</div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CommentComponent;