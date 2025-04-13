import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Box,
  Fade,
  Typography,
  Tooltip,
  Alert,
  Paper,
  Zoom,
  Chip,
  Avatar,
  Stack,
  Collapse
} from '@mui/material';
import {
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  BookmarkBorder as BookmarkIcon,
  Edit as EditIcon,
  Tag as TagIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 142, 83, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.5); }
`;

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  overflow: 'visible',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)'
  }
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  color: '#fff',
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '150%',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
    animation: `${shimmerAnimation} 3s infinite linear`,
    backgroundSize: '200% 100%',
    pointerEvents: 'none'
  },
  '& .MuiCardHeader-title': {
    fontSize: '1.5rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2)
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    },
    '&.Mui-focused': {
      backgroundColor: 'white',
      boxShadow: '0 0 0 2px rgba(255, 107, 107, 0.2)'
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#FF6B6B'
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.2, 3),
  fontWeight: 600,
  boxShadow: 'none',
  transition: 'all 0.3s ease',
  textTransform: 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)'
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    backgroundColor: '#e0e0e0',
    color: '#9e9e9e'
  }
}));

const UpdateButton = styled(ActionButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)',
    boxShadow: '0 5px 15px rgba(255, 107, 107, 0.3)',
    transform: 'translateY(-2px)'
  }
}));

const DeleteButton = styled(ActionButton)(({ theme }) => ({
  background: 'rgba(244, 67, 54, 0.1)',
  color: '#f44336',
  '&:hover': {
    background: 'rgba(244, 67, 54, 0.15)',
    boxShadow: '0 5px 15px rgba(244, 67, 54, 0.2)',
    transform: 'translateY(-2px)'
  }
}));

const WarningBadge = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  animation: `${pulseAnimation} 2s infinite ease-in-out`,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
}));

const IdChip = styled(Chip)(({ theme }) => ({
  fontFamily: 'monospace',
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  border: '1px dashed rgba(0, 0, 0, 0.1)',
  borderRadius: theme.spacing(1),
  '& .MuiChip-label': {
    fontWeight: 500,
  },
  '& .MuiChip-icon': {
    color: '#FF8E53'
  }
}));

const GlowingIcon = styled(Box)(({ theme }) => ({
  animation: `${floatAnimation} 3s infinite ease-in-out, ${glowAnimation} 4s infinite ease-in-out`,
  '& svg': {
    fontSize: '2rem',
    filter: 'drop-shadow(0 0 5px rgba(255, 142, 83, 0.5))',
  }
}));

const EmptyStateBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: '#9e9e9e',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: theme.spacing(2),
  border: '1px dashed rgba(0, 0, 0, 0.1)',
  '& svg': {
    fontSize: 60,
    color: 'rgba(0, 0, 0, 0.15)',
    marginBottom: theme.spacing(2)
  }
}));

const InfoBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 142, 83, 0.05)',
  border: '1px solid rgba(255, 142, 83, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  '& svg': {
    color: '#FF8E53',
  }
}));

const CategoryAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 142, 83, 0.2)',
  color: '#FF8E53',
  width: theme.spacing(6),
  height: theme.spacing(6),
  boxShadow: '0 4px 12px rgba(255, 142, 83, 0.2)',
  animation: `${floatAnimation} 3s infinite ease-in-out`,
  marginBottom: theme.spacing(2),
  '& svg': {
    fontSize: '1.8rem',
  }
}));

const StatusChip = styled(Chip)(({ status, theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  ...(status === 'success' && {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    color: '#2ecc71',
    border: '1px solid rgba(46, 204, 113, 0.3)',
  }),
  ...(status === 'warning' && {
    backgroundColor: 'rgba(255, 142, 83, 0.1)',
    color: '#FF8E53',
    border: '1px solid rgba(255, 142, 83, 0.3)',
    animation: `${pulseAnimation} 2s infinite ease-in-out`,
  }),
  ...(status === 'error' && {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.3)',
  }),
}));

class CategoryDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      txtID: '',
      txtName: '',
      isLoading: false,
      hasChanges: false,
      error: null,
      isDeleteHovered: false,
      lastUpdated: null,
      saveSuccess: false
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      this.setState({
        txtID: this.props.item?._id || '',
        txtName: this.props.item?.name || '',
        hasChanges: false,
        error: null,
        isDeleteHovered: false
      });
    }
  }

  handleInputChange = (e) => {
    const value = e.target.value;
    this.setState({
      txtName: value,
      hasChanges: this.props.item?.name !== value,
      error: !value.trim() ? 'Vui lòng nhập tên danh mục' : null,
      saveSuccess: false
    });
  };

  validateForm = () => {
    const { txtName } = this.state;
    if (!txtName.trim()) {
      this.setState({ error: 'Vui lòng nhập tên danh mục' });
      return false;
    }
    return true;
  };

  btnUpdateClick = async (e) => {
    e.preventDefault();
    if (!this.validateForm()) return;

    const { txtID, txtName } = this.state;
    const result = await this.apiPutCategory(txtID, { name: txtName });
    
    if (result.success) {
      this.setState({ 
        hasChanges: false, 
        lastUpdated: new Date(),
        saveSuccess: true 
      });
      
      // Clear success status after 3 seconds
      setTimeout(() => {
        this.setState({ saveSuccess: false });
      }, 3000);
    }
  };

  btnDeleteClick = async (e) => {
    e.preventDefault();
    
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
      const { txtID } = this.state;
      const result = await this.apiDeleteCategory(txtID);
      
      if (result.success) {
        this.setState({ 
          txtID: '',
          txtName: '',
          hasChanges: false,
          error: null,
          isDeleteHovered: false
        });
      }
    }
  };

  apiPutCategory = async (id, category) => {
    this.setState({ isLoading: true, error: null });
    
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.put(`/api/admin/categories/${id}`, category, config);
      const result = response.data;
      
      if (result.success) {
        toast.success('Cập nhật danh mục thành công');
        this.props.updateCategories();
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi cập nhật danh mục';
      this.setState({ error: errorMessage });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      this.setState({ isLoading: false });
    }
  };

  apiDeleteCategory = async (id) => {
    this.setState({ isLoading: true, error: null });
    
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.delete(`/api/admin/categories/${id}`, config);
      const result = response.data;
      
      if (result.success) {
        toast.success('Xóa danh mục thành công');
        this.props.updateCategories();
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi xóa danh mục';
      this.setState({ error: errorMessage });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      this.setState({ isLoading: false });
    }
  };

  formatLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  render() {
    const { txtID, txtName, isLoading, hasChanges, error, isDeleteHovered, lastUpdated, saveSuccess } = this.state;
    const hasItem = Boolean(txtID);

    return (
      <Fade in timeout={600}>
        <Box>
          <StyledCard>
            <StyledCardHeader
              title={
                <Box display="flex" alignItems="center" gap={2}>
                  <GlowingIcon>
                    <FolderIcon fontSize="large" />
                  </GlowingIcon>
                  <Typography variant="h5" fontWeight="bold">
                    Chi Tiết Danh Mục
                  </Typography>
                </Box>
              }
              action={
                hasChanges && (
                  <Tooltip title="Có thay đổi chưa lưu">
                    <WarningBadge>
                      <WarningIcon />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        Chưa lưu
                      </Typography>
                    </WarningBadge>
                  </Tooltip>
                )
              }
            />

            <CardContent sx={{ p: 3 }}>
              <Collapse in={hasItem && lastUpdated !== null && saveSuccess}>
                <InfoBox sx={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', borderColor: 'rgba(46, 204, 113, 0.3)', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#2ecc71' }} />
                  <Typography variant="body2">
                    Lưu thành công lúc {this.formatLastUpdated(lastUpdated)}
                  </Typography>
                </InfoBox>
              </Collapse>

              <Collapse in={Boolean(error)}>
                <Zoom in>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
                    }}
                    onClose={() => this.setState({ error: null })}
                    icon={<ErrorIcon />}
                  >
                    {error}
                  </Alert>
                </Zoom>
              </Collapse>

              {hasItem ? (
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <CategoryAvatar>
                      <BookmarkIcon />
                    </CategoryAvatar>
                    <Typography variant="h6" gutterBottom fontWeight="600">
                      {txtName || 'Chưa có tên'}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <StatusChip 
                        label={hasChanges ? "Đã chỉnh sửa" : "Không thay đổi"} 
                        status={hasChanges ? "warning" : "success"}
                        size="small"
                        icon={hasChanges ? <EditIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      />
                    </Stack>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="600">
                          Mã danh mục
                        </Typography>
                        <IdChip 
                          icon={<TagIcon />} 
                          label={txtID}
                          variant="outlined"
                          sx={{ width: '100%', justifyContent: 'flex-start', height: 'auto', py: 1.5 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="600">
                        Tên danh mục
                      </Typography>
                      <StyledTextField
                        value={txtName}
                        onChange={this.handleInputChange}
                        fullWidth
                        error={Boolean(error)}
                        placeholder="Nhập tên danh mục..."
                        InputProps={{
                          startAdornment: <BookmarkIcon sx={{ mr: 1, color: '#FF8E53' }} />,
                          endAdornment: hasChanges && <EditIcon sx={{ color: '#FF8E53', animation: `${pulseAnimation} 1.5s infinite ease-in-out` }} />
                        }}
                        disabled={isLoading}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        <InfoIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Tên danh mục sẽ hiển thị cho khách hàng khi mua sắm
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ) : (
                <EmptyStateBox>
                  <FolderIcon />
                  <Typography variant="h6" mb={1}>Chưa chọn danh mục</Typography>
                  <Typography variant="body2" textAlign="center">
                    Vui lòng chọn một danh mục từ bảng bên trái để xem và chỉnh sửa chi tiết
                  </Typography>
                </EmptyStateBox>
              )}
              
              {hasItem && lastUpdated && (
                <Box mt={2} display="flex" alignItems="center" justifyContent="flex-end">
                  <HistoryIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {this.formatLastUpdated(lastUpdated)}
                  </Typography>
                </Box>
              )}
            </CardContent>

            <Divider />

            <CardActions sx={{ p: 3, bgcolor: '#f8f9fa', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                {hasItem && (
                  <DeleteButton
                    variant="contained"
                    onClick={this.btnDeleteClick}
                    disabled={isLoading || !hasItem}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    onMouseEnter={() => this.setState({ isDeleteHovered: true })}
                    onMouseLeave={() => this.setState({ isDeleteHovered: false })}
                  >
                    {isDeleteHovered ? 'Xác nhận xóa' : 'Xóa'}
                  </DeleteButton>
                )}
              </Box>
              <UpdateButton
                variant="contained"
                onClick={this.btnUpdateClick}
                disabled={isLoading || !hasChanges || !hasItem || !txtName.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </UpdateButton>
            </CardActions>
          </StyledCard>
        </Box>
      </Fade>
    );
  }
}

export default CategoryDetail;