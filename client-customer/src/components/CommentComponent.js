import React, { Component } from 'react';
import { toast } from 'react-toastify';
import { FaStar, FaReply, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import MyContext from '../contexts/MyContext';
import APIService from './services/APIService';
import '../styles/CommentComponent.css';

class CommentComponent extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            comments: [],
            loading: true,
            error: null,
            newComment: '',
            rating: 5,
            replyToId: null,
            replyContent: '',
            editingId: null,
            editContent: '',
            editRating: 5,
            pagination: {
                total: 0,
                page: 1,
                limit: 5,
                pages: 1
            },
            productRating: {
                averageRating: 0,
                totalRatings: 0,
                ratingCounts: {}
            },
            hasPurchased: false,
            replyToAuthor: null,
            showProfileTooltip: false,
            profileUsername: null,
            tooltipPosition: null,
            expandedReplies: {},
            maxRepliesVisible: 1
        };
        this.replyInput = null;
    }

    componentDidMount() {
        this.fetchComments();
        this.checkPurchaseHistory();
    }

    // Fetch comments for the product
    fetchComments = async () => {
        try {
            const { page, limit } = this.state.pagination;
            const { productId } = this.props;
            
            const response = await APIService.getCommentsByProduct(productId, page, limit);
            
            if (response.success) {
                // Đảm bảo các giá trị mặc định cho dữ liệu
                const comments = response.data.comments || [];
                const rating = response.data.rating || {
                    averageRating: 0,
                    totalRatings: 0,
                    ratingCounts: {}
                };
                const pagination = response.data.pagination || {
                    total: 0,
                    page: 1,
                    limit: 5,
                    pages: 1
                };
                
                this.setState({
                    comments,
                    productRating: rating,
                    pagination,
                    loading: false
                });
            } else {
                this.setState({
                    error: response.message,
                    loading: false
                });
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            this.setState({
                error: 'Không thể tải bình luận. Vui lòng thử lại sau.',
                loading: false
            });
        }
    };

    // Handle page change for comments pagination
    handlePageChange = (page) => {
        this.setState(
            prevState => ({
                pagination: {
                    ...prevState.pagination,
                    page
                }
            }),
            () => this.fetchComments()
        );
    };

    // Handle input changes for comment form
    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    // Handle star rating selection
    handleRatingChange = (rating) => {
        this.setState({ rating });
    };

    // Submit a new comment
    handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        const { token, customer } = this.context;
        
        if (!token) {
            toast.error('Vui lòng đăng nhập để bình luận.');
            return;
        }
        
        const { newComment, rating, hasPurchased } = this.state;
        const { productId } = this.props;
        
        if (!newComment.trim()) {
            toast.error('Vui lòng nhập nội dung bình luận.');
            return;
        }

        try {
            const commentData = {
                content: newComment,
                rating,
                product: productId,
                verifiedPurchase: hasPurchased
            };
            
            const response = await APIService.addComment(commentData, token);

            if (response.success) {
                toast.success('Đã thêm bình luận thành công!');
                this.setState({ newComment: '', rating: 5 });
                this.fetchComments();
            } else {
                toast.error(response.message || 'Không thể đăng bình luận.');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi gửi bình luận.');
        }
    };

    // Toggle reply form for a comment with author info
    toggleReplyForm = (commentId, commentAuthor, username) => {
        // Use username from parameter if available, otherwise use commentAuthor
        const authorName = username || commentAuthor;
        
        this.setState(prevState => ({
            replyToId: prevState.replyToId === commentId ? null : commentId,
            replyContent: '',
            editingId: null,
            replyToAuthor: authorName
        }));
        
        // Focus on textarea after a small delay
        setTimeout(() => {
            if (this.replyInput) {
                this.replyInput.focus();
            }
        }, 100);
    };

    // Handle reply input change
    handleReplyChange = (e) => {
        this.setState({ replyContent: e.target.value });
    };

    // Submit a reply to a comment
    handleReplySubmit = async (e) => {
        e.preventDefault();
        
        const { token } = this.context;
        
        if (!token) {
            toast.error('Vui lòng đăng nhập để trả lời bình luận.');
            return;
        }
        
        const { replyContent, replyToId, replyToAuthor } = this.state;
        const { productId } = this.props;
        
        if (!replyContent.trim()) {
            toast.error('Vui lòng nhập nội dung trả lời.');
            return;
        }

        try {
            // Kiểm tra xem nội dung đã có @username chưa 
            let formattedContent = replyContent.trim();
            const hasMention = formattedContent.match(/^@[a-zA-Z0-9_]+/);
            
            // Chỉ thêm @username nếu chưa có và có replyToAuthor
            if (!hasMention && replyToAuthor) {
                formattedContent = `@${replyToAuthor} ${formattedContent}`;
            }
            
            // Tìm comment đang trả lời để xác định parentId thực sự
            const { comments } = this.state;
            let actualParentId = replyToId;
            let replyToInfo = null;
            
            // Tìm trong tất cả các comment
            const findComment = (commentId) => {
                // Tìm trong comments chính
                const parentComment = comments.find(c => c._id === commentId);
                if (parentComment) return parentComment;
                
                // Tìm trong replies
                for (const comment of comments) {
                    if (comment.replies && comment.replies.length > 0) {
                        const reply = comment.replies.find(r => r._id === commentId);
                        if (reply) return { ...reply, parentComment: comment };
                    }
                }
                return null;
            };
            
            const commentToReply = findComment(replyToId);
            
            if (commentToReply) {
                // Lưu thông tin người được trả lời (người viết bình luận gốc)
                replyToInfo = {
                    userId: commentToReply.customer?._id,
                    name: commentToReply.customer?.name,
                    username: commentToReply.customer?.username
                };
                
                // Nếu comment đang reply là một reply (có parentId), sử dụng parentId của nó
                if (commentToReply.parentId) {
                    actualParentId = commentToReply.parentComment ? commentToReply.parentComment._id : commentToReply.parentId;
                }
            }
                
            const replyData = {
                content: formattedContent,
                product: productId,
                parentId: actualParentId,
                replyToUser: replyToInfo // Thêm thông tin người được trả lời
            };
            
            const response = await APIService.addComment(replyData, token);

            if (response.success) {
                toast.success('Đã trả lời bình luận thành công!');
                this.setState({ replyToId: null, replyContent: '', replyToAuthor: null });
                this.fetchComments();
            } else {
                toast.error(response.message || 'Không thể trả lời bình luận.');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi gửi trả lời.');
        }
    };

    // Toggle edit form for a comment
    toggleEditForm = (comment) => {
        this.setState({
            editingId: comment._id,
            editContent: comment.content,
            editRating: comment.rating || 5,
            replyToId: null
        });
    };

    // Handle edit input change
    handleEditChange = (e) => {
        this.setState({ editContent: e.target.value });
    };

    // Handle edit rating change
    handleEditRatingChange = (rating) => {
        this.setState({ editRating: rating });
    };

    // Submit edited comment
    handleEditSubmit = async (e) => {
        e.preventDefault();
        
        const { editContent, editRating, editingId } = this.state;
        const { token } = this.context;
        
        if (!token) {
            toast.error('Vui lòng đăng nhập để chỉnh sửa bình luận.');
            return;
        }
        
        if (!editContent.trim()) {
            toast.error('Vui lòng nhập nội dung bình luận.');
            return;
        }

        try {
            const updateData = {
                content: editContent
            };

            // Only include rating if it's a parent comment (not a reply)
            const comment = this.state.comments.find(c => c._id === editingId) || 
                           this.state.comments.flatMap(c => c.replies || []).find(r => r._id === editingId);
            
            if (comment && !comment.parentId) {
                updateData.rating = editRating;
            }

            const response = await APIService.updateComment(editingId, updateData, token);

            if (response.success) {
                toast.success('Đã cập nhật bình luận thành công!');
                this.setState({ editingId: null, editContent: '', editRating: 5 });
                this.fetchComments();
            } else {
                toast.error(response.message || 'Không thể cập nhật bình luận.');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật bình luận.');
        }
    };

    // Delete a comment
    handleDeleteComment = async (commentId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
            return;
        }

        const { token } = this.context;
        
        if (!token) {
            toast.error('Vui lòng đăng nhập để xóa bình luận.');
            return;
        }

        try {
            const response = await APIService.deleteComment(commentId, token);

            if (response.success) {
                toast.success('Đã xóa bình luận thành công!');
                this.fetchComments();
            } else {
                toast.error(response.message || 'Không thể xóa bình luận.');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi xóa bình luận.');
        }
    };

    // Format date to display
    formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if current user is the author of a comment
    isCommentAuthor = (comment) => {
        const { customer } = this.context;
        if (!customer || !comment?.customer) return false;
        return customer._id === comment.customer._id;
    };

    // Render star rating input
    renderStarRating = (value, onChange) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <FaStar
                        key={star}
                        className={star <= value ? "star active" : "star"}
                        onClick={() => onChange(star)}
                    />
                ))}
            </div>
        );
    };

    // Render star rating display (read-only)
    renderStarRatingDisplay = (rating) => {
        return (
            <div className="star-rating-display">
                {[1, 2, 3, 4, 5].map(star => (
                    <FaStar
                        key={star}
                        className={star <= rating ? "star active" : "star"}
                    />
                ))}
                <span className="rating-text">({rating}/5)</span>
            </div>
        );
    };

    // Render rating statistics
    renderRatingStats = () => {
        const { productRating } = this.state;
        
        if (!productRating || productRating.totalRatings === 0) {
            return <p>Chưa có đánh giá nào.</p>;
        }

        // Đảm bảo ratingCounts tồn tại
        const ratingCounts = productRating.ratingCounts || {};

        return (
            <div className="rating-stats">
                <div className="average-rating">
                    <div className="rating-number">{productRating.averageRating.toFixed(1)}</div>
                    {this.renderStarRatingDisplay(Math.round(productRating.averageRating))}
                    <div className="total-ratings">({productRating.totalRatings} đánh giá)</div>
                </div>
                <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingCounts[star] || 0;
                        const percentage = productRating.totalRatings > 0 
                            ? (count / productRating.totalRatings) * 100 
                            : 0;
                            
                        return (
                            <div className="rating-bar-container" key={star}>
                                <div className="rating-label">{star} <FaStar className="star active" /></div>
                                <div className="rating-bar">
                                    <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <div className="rating-count">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Check if user has purchased this product before
    checkPurchaseHistory = async () => {
        const { token } = this.context;
        
        if (!token) {
            return;
        }
        
        try {
            const { productId } = this.props;
            
            const response = await APIService.checkPurchaseHistory(productId, token);
            
            if (response.success && response.data.hasPurchased) {
                this.setState({ hasPurchased: true });
            }
        } catch (error) {
            console.error('Error checking purchase history:', error);
        }
    };

    // Render comment form
    renderCommentForm = () => {
        const { token } = this.context;
        const { newComment, rating, hasPurchased } = this.state;

        if (!token) {
            return (
                <div className="comment-login-msg">
                    <p>Vui lòng <a href="/login">đăng nhập</a> để bình luận.</p>
                </div>
            );
        }

        return (
            <form onSubmit={this.handleCommentSubmit} className="comment-form">
                <h4>Viết đánh giá của bạn</h4>
                {hasPurchased && (
                    <div className="verified-purchase-badge">
                        <span>✓ Đã mua hàng tại shop</span>
                    </div>
                )}
                <div className="rating-container">
                    <label>Đánh giá của bạn:</label>
                    {this.renderStarRating(rating, this.handleRatingChange)}
                </div>
                <div className="comment-input-container">
                    <textarea
                        name="newComment"
                        value={newComment}
                        onChange={this.handleInputChange}
                        placeholder="Viết bình luận của bạn..."
                        rows="4"
                        required
                    />
                </div>
                <button type="submit" className="comment-submit-btn">Gửi bình luận</button>
            </form>
        );
    };

    // Render reply form
    renderReplyForm = (commentId) => {
        const { replyContent, replyToId, replyToAuthor } = this.state;
        
        if (replyToId !== commentId) return null;
        
        return (
            <form onSubmit={this.handleReplySubmit} className="reply-form">
                {replyToAuthor && (
                    <div className="reply-to-info">
                        Đang trả lời <span className="reply-author">@{replyToAuthor}</span>
                    </div>
                )}
                <textarea
                    ref={(input) => {this.replyInput = input}}
                    value={replyContent}
                    onChange={this.handleReplyChange}
                    placeholder={`Viết trả lời của bạn cho ${replyToAuthor || 'bình luận này'}...`}
                    rows="3"
                    required
                    autoFocus
                />
                <div className="reply-form-actions">
                    <button type="submit" className="reply-submit-btn">Gửi</button>
                    <button 
                        type="button" 
                        className="reply-cancel-btn"
                        onClick={() => this.toggleReplyForm(commentId)}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        );
    };

    // Render edit form
    renderEditForm = (comment) => {
        const { editContent, editRating, editingId } = this.state;
        
        if (editingId !== comment._id) return null;
        
        return (
            <form onSubmit={this.handleEditSubmit} className="edit-form">
                {!comment.parentId && (
                    <div className="rating-container">
                        <label>Đánh giá:</label>
                        {this.renderStarRating(editRating, this.handleEditRatingChange)}
                    </div>
                )}
                <textarea
                    value={editContent}
                    onChange={this.handleEditChange}
                    placeholder="Chỉnh sửa bình luận của bạn..."
                    rows="3"
                    required
                />
                <div className="edit-form-actions">
                    <button type="submit" className="edit-submit-btn">Cập nhật</button>
                    <button 
                        type="button" 
                        className="edit-cancel-btn"
                        onClick={() => this.setState({ editingId: null })}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        );
    };

    // Handle hover on username to show profile tooltip
    handleUsernameHover = (username, event) => {
        if (!username) return;
        
        // Position for tooltip based on mouse position
        const rect = event.target.getBoundingClientRect();
        const tooltipX = rect.left;
        const tooltipY = rect.bottom + window.scrollY;
        
        this.setState({
            showProfileTooltip: true,
            profileUsername: username,
            tooltipPosition: { x: tooltipX, y: tooltipY }
        });
    }
    
    // Handle mouse leave for tooltip
    handleTooltipLeave = () => {
        this.setState({
            showProfileTooltip: false,
            profileUsername: null
        });
    }
    
    // Render profile tooltip
    renderProfileTooltip = () => {
        const { profileUsername, tooltipPosition } = this.state;
        
        if (!profileUsername || !tooltipPosition) return null;
        
        return (
            <div 
                className="profile-tooltip"
                style={{ 
                    top: tooltipPosition.y + 'px', 
                    left: tooltipPosition.x + 'px' 
                }}
                onMouseLeave={this.handleTooltipLeave}
            >
                <div className="tooltip-avatar">
                    <FaUser size={24} />
                </div>
                <div className="tooltip-info">
                    <h4>{profileUsername}</h4>
                    <button 
                        className="tooltip-action"
                        onClick={() => {
                            this.handleMentionClick(profileUsername);
                            this.handleTooltipLeave();
                        }}
                    >
                        <FaReply /> Nhắc đến
                    </button>
                </div>
            </div>
        );
    }

    // Format comment content with clickable mentions
    formatCommentContent = (content) => {
        if (!content) return '';
        
        // Regex to find mentions with better pattern matching
        const mentionRegex = /@(\S+?)(?=\s|$|[.,;:!?])/g;
        const parts = [];
        
        let lastIndex = 0;
        let match;
        
        // Prevent processing if content is already an array (already processed)
        if (Array.isArray(content)) {
            return content;
        }
        
        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            
            // Extract username cleanly
            const username = match[1];
            
            // Add the mention as a clickable span
            parts.push(
                <span 
                    key={`mention-${match.index}`} 
                    className="mention"
                    onClick={() => this.handleMentionClick(username)}
                    onMouseEnter={(e) => this.handleUsernameHover(username, e)}
                >
                    @{username}
                </span>
            );
            
            // Update lastIndex to include any punctuation after the username
            lastIndex = match.index + match[0].length;
            
            // Check if there's punctuation right after the match and include it in lastIndex
            const afterMatchChar = content.charAt(lastIndex);
            if (/[.,;:!?]/.test(afterMatchChar)) {
                parts.push(afterMatchChar);
                lastIndex++;
            }
        }
        
        // Add remaining text after the last match
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : content;
    }
    
    // Find comment by username
    findCommentByUsername = (username) => {
        const { comments } = this.state;
        if (!username || !comments || comments.length === 0) return null;
        
        // Tìm trong comments chính
        let targetComment = comments.find(comment => 
            (comment.customer?.username === username || comment.customer?.name === username)
        );
        
        // Nếu không tìm thấy, tìm trong replies
        if (!targetComment) {
            for (const comment of comments) {
                if (comment.replies && comment.replies.length > 0) {
                    const reply = comment.replies.find(r => 
                        (r.customer?.username === username || r.customer?.name === username)
                    );
                    if (reply) {
                        targetComment = reply;
                        break;
                    }
                }
            }
        }
        
        return targetComment;
    }
    
    // Handle click on mention
    handleMentionClick = (username) => {
        const { replyToId } = this.state;
        
        if (replyToId) {
            // Nếu đang mở sẵn form trả lời, thêm vào nội dung
            this.setState(prevState => ({
                replyContent: prevState.replyContent ? `${prevState.replyContent} @${username} ` : `@${username} `
            }));
            
            // Focus vào textarea của reply form
            setTimeout(() => {
                if (this.replyInput) {
                    this.replyInput.focus();
                    // Đặt con trỏ vào cuối văn bản
                    this.replyInput.selectionStart = this.replyInput.value.length;
                    this.replyInput.selectionEnd = this.replyInput.value.length;
                }
            }, 100);
        } else {
            // Tìm comment của username được đề cập
            const targetComment = this.findCommentByUsername(username);
            
            // Nếu tìm thấy, mở form reply cho comment đó
            if (targetComment) {
                this.setState({
                    replyToId: targetComment._id,
                    replyContent: `@${username} `,
                    replyToAuthor: targetComment.customer?.name || username
                });
                
                // Scroll đến comment đó
                setTimeout(() => {
                    document.querySelector(`[data-comment-id="${targetComment._id}"]`)?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // Focus vào textarea
                    if (this.replyInput) {
                        this.replyInput.focus();
                    }
                }, 100);
            } else {
                // Nếu không tìm thấy, mở form reply cho comment đầu tiên
                const { comments } = this.state;
                if (comments.length > 0) {
                    this.setState({
                        replyToId: comments[0]._id,
                        replyContent: `@${username} `,
                        replyToAuthor: comments[0].customer?.name
                    });
                    
                    setTimeout(() => {
                        if (this.replyInput) {
                            this.replyInput.focus();
                        }
                    }, 100);
                }
            }
        }
    };

    // Đảm bảo nội dung bình luận hiển thị đúng khi có mention
    getReplyAuthorName = (comment) => {
        if (!comment) return null;
        
        // Ưu tiên sử dụng thông tin từ replyToUser (cấu trúc mới)
        if (comment.replyToUser) {
            return comment.replyToUser.username || comment.replyToUser.name;
        }
        
        // Nếu không có replyToUser, dùng replyTo (cấu trúc cũ)
        if (comment.replyTo) {
            return comment.replyTo.username || comment.replyTo.name;
        }
        
        return null;
    }
    
    // Xử lý nội dung bình luận để loại bỏ mention ở đầu nếu cần thiết
    processCommentContent = (comment) => {
        if (!comment || !comment.content) return '';
        
        // Nếu là reply và có thông tin người được trả lời, kiểm tra xem có mention ở đầu không
        if (comment.parentId) {
            const replyAuthorName = this.getReplyAuthorName(comment);
            if (replyAuthorName) {
                // Tìm mention ở đầu chuỗi với định dạng @username 
                const mentionPattern = new RegExp(`^@${replyAuthorName}\\s+`);
                // Loại bỏ mention đó vì đã có hiển thị "Đã trả lời @username"
                return comment.content.replace(mentionPattern, '');
            }
        }
        
        return comment.content;
    }
    
    // Toggle hiển thị tất cả replies của một comment
    toggleRepliesVisibility = (commentId) => {
        this.setState(prevState => ({
            expandedReplies: {
                ...prevState.expandedReplies,
                [commentId]: !prevState.expandedReplies[commentId]
            }
        }));
    }
    
    // Render replies của một comment
    renderReplies = (comment) => {
        if (!comment.replies || comment.replies.length === 0) return null;
        
        const { expandedReplies, maxRepliesVisible } = this.state;
        const isExpanded = expandedReplies[comment._id] || false;
        
        // Nếu chưa mở rộng, chỉ hiển thị số lượng giới hạn replies
        const visibleReplies = isExpanded 
            ? comment.replies 
            : comment.replies.slice(0, maxRepliesVisible);
        
        const remainingReplies = comment.replies.length - maxRepliesVisible;
        
        return (
            <div className="comment-replies">
                {visibleReplies.map(reply => this.renderComment(reply))}
                
                {!isExpanded && remainingReplies > 0 && (
                    <div className="view-more-replies">
                        <button 
                            className="view-more-btn"
                            onClick={() => this.toggleRepliesVisibility(comment._id)}
                        >
                            Xem thêm {remainingReplies} phản hồi
                        </button>
                    </div>
                )}
                
                {isExpanded && remainingReplies > 0 && (
                    <div className="view-less-replies">
                        <button 
                            className="view-less-btn"
                            onClick={() => this.toggleRepliesVisibility(comment._id)}
                        >
                            Thu gọn
                        </button>
                    </div>
                )}
            </div>
        );
    }
    
    // Render a single comment with improved username handling
    renderComment = (comment) => {
        const { editingId, replyToId } = this.state;
        const { token, customer } = this.context;
        const isAuthor = this.isCommentAuthor(comment);
        const isReply = comment.parentId !== null && comment.parentId !== undefined;
        
        // Extract username (use name if username not available)
        const username = comment.customer?.username || comment.customer?.name;
        // Get the reply author name if this comment is a reply
        const replyAuthorName = this.getReplyAuthorName(comment);
        // Process the comment content
        const processedContent = this.processCommentContent(comment);

        return (
            <div 
                className={`comment-item ${isReply ? 'comment-reply' : ''}`} 
                key={comment._id}
                data-comment-id={comment._id}
            >
                <div className="comment-avatar">
                    <FaUser />
                </div>
                <div className="comment-content">
                    <div className="comment-header">
                        <div className="comment-author-container">
                            <h4 
                                className="comment-author"
                                onMouseEnter={(e) => this.handleUsernameHover(username, e)}
                            >
                                {comment.customer?.name || 'Người dùng'}
                            </h4>
                            {comment.verifiedPurchase && (
                                <div className="comment-verified-badge">
                                    <span>✓ Đã mua hàng</span>
                                </div>
                            )}
                        </div>
                        {!comment.parentId && comment.rating && (
                            <div className="comment-rating">
                                {this.renderStarRatingDisplay(comment.rating)}
                            </div>
                        )}
                    </div>
                    
                    {editingId === comment._id ? (
                        this.renderEditForm(comment)
                    ) : (
                        <>
                            {replyAuthorName && (
                                <div className="replied-to">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="reply-arrow">
                                        <path d="M12.14 8.753l-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                                    </svg>
                                    Đã trả lời <span 
                                        className="reply-author" 
                                        onClick={() => this.handleMentionClick(replyAuthorName)}
                                        onMouseEnter={(e) => this.handleUsernameHover(replyAuthorName, e)}
                                    >
                                        @{replyAuthorName}
                                    </span>
                                </div>
                            )}
                            <p className="comment-text">{this.formatCommentContent(processedContent)}</p>
                            <div className="comment-meta">
                                <span className="comment-date">
                                    {this.formatDate(comment.createdAt)}
                                    {comment.isEdited && ' (đã chỉnh sửa)'}
                                </span>
                                {token && (
                                    <div className="comment-actions">
                                        <button 
                                            className="reply-btn"
                                            onClick={() => this.toggleReplyForm(comment._id, comment.customer?.name, username)}
                                        >
                                            <FaReply /> Trả lời
                                        </button>
                                        
                                        {isAuthor && (
                                            <>
                                                <button 
                                                    className="edit-btn"
                                                    onClick={() => this.toggleEditForm(comment)}
                                                >
                                                    <FaEdit /> Sửa
                                                </button>
                                                <button 
                                                    className="delete-btn"
                                                    onClick={() => this.handleDeleteComment(comment._id)}
                                                >
                                                    <FaTrash /> Xóa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    
                    {replyToId === comment._id && this.renderReplyForm(comment._id)}
                    
                    {/* Sử dụng phương thức renderReplies thay vì trực tiếp hiển thị replies */}
                    {this.renderReplies(comment)}
                </div>
            </div>
        );
    };

    // Render pagination
    renderPagination = () => {
        const { pagination } = this.state;
        
        if (pagination.pages <= 1) return null;
        
        const pages = [];
        for (let i = 1; i <= pagination.pages; i++) {
            pages.push(
                <button
                    key={i}
                    className={`page-btn ${pagination.page === i ? 'active' : ''}`}
                    onClick={() => this.handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }
        
        return (
            <div className="comments-pagination">
                {pagination.page > 1 && (
                    <button 
                        className="page-btn prev"
                        onClick={() => this.handlePageChange(pagination.page - 1)}
                    >
                        &laquo; Trước
                    </button>
                )}
                {pages}
                {pagination.page < pagination.pages && (
                    <button 
                        className="page-btn next"
                        onClick={() => this.handlePageChange(pagination.page + 1)}
                    >
                        Sau &raquo;
                    </button>
                )}
            </div>
        );
    };

    render() {
        const { comments, loading, error, replyToId, showProfileTooltip } = this.state;

        if (loading) {
            return <div className="comments-loading">Đang tải bình luận...</div>;
        }

        if (error) {
            return <div className="comments-error">Lỗi: {error}</div>;
        }

        return (
            <div className="comments-section">
                <h3 className="comments-title">Đánh giá & Bình luận</h3>
                
                {this.renderRatingStats()}
                {this.renderCommentForm()}
                
                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                    ) : (
                        comments.map(comment => this.renderComment(comment))
                    )}
                </div>
                
                {this.renderPagination()}
                
                {showProfileTooltip && this.renderProfileTooltip()}
            </div>
        );
    }
}

export default CommentComponent; 