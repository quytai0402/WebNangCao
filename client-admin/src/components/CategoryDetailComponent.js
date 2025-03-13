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
  Chip
} from '@mui/material';
import {
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  BookmarkBorder as BookmarkIcon,
  Edit as EditIcon,
  Tag as TagIcon
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
  animation: `${floatAnimation} 3s infinite ease-in-out`,
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
  '& svg': {
    fontSize: 60,
    color: 'rgba(0, 0, 0, 0.15)',
    marginBottom: theme.spacing(2)
  }
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
      isDeleteHovered: false
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      this.setState({
        txtID: this.props.item?._id || '',
        txtName: this.props.item?.name || '',
        hasChanges: false,
        error: null
      });
    }
  }

  handleInputChange = (e) => {
    const value = e.target.value;
    this.setState({
      txtName: value,
      hasChanges: this.props.item?.name !== value,
      error: !value.trim() ? 'Vui lòng nhập tên danh mục' : null
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
    if (!txtID) return;

    const category = { name: txtName.trim() };
    await this.apiPutCategory(txtID, category);
  };

  btnDeleteClick = async (e) => {
    e.preventDefault();
    const { txtID, txtName } = this.state;
    
    if (!txtID) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa danh mục "${txtName}"?\nHành động này không thể hoàn tác.`
    );

    if (confirmDelete) {
      this.setState({ isLoading: true, error: null });
      await this.apiDeleteCategory(txtID);
    }
  };

  apiPutCategory = async (id, category) => {
    this.setState({ isLoading: true });
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.put(`/api/admin/categories/${id}`, category, config);
      
      if (response.data.success) {
        toast.success('Cập nhật danh mục thành công!', {
          icon: '✨',
          position: "bottom-right"
        });
        this.setState({ hasChanges: false });
        this.props.updateCategories();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error('Lỗi cập nhật: ' + errorMessage);
      this.setState({ error: errorMessage });
    } finally {
      this.setState({ isLoading: false });
    }
  };
  
  apiDeleteCategory = async (id) => {
    this.setState({ isLoading: true });
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.delete(`/api/admin/categories/${id}`, config);
      
      if (response.data.success) {
        toast.success('Xóa danh mục thành công!', {
          icon: '🗑️',
          position: "bottom-right"
        });
        this.setState({ 
          txtID: '', 
          txtName: '', 
          hasChanges: false
        });
        this.props.updateCategories();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error('Lỗi xóa: ' + errorMessage);
      this.setState({ error: errorMessage });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    const { txtID, txtName, isLoading, hasChanges, error, isDeleteHovered } = this.state;
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
              {error && (
                <Zoom in>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
                    }}
                    onClose={() => this.setState({ error: null })}
                  >
                    {error}
                  </Alert>
                </Zoom>
              )}

              {hasItem ? (
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tên danh mục
                      </Typography>
                      <StyledTextField
                        value={txtName}
                        onChange={this.handleInputChange}
                        fullWidth
                        error={Boolean(error)}
                        helperText={error}
                        placeholder="Nhập tên danh mục..."
                        InputProps={{
                          startAdornment: <BookmarkIcon sx={{ mr: 1, color: '#FF8E53' }} />,
                          endAdornment: hasChanges && <EditIcon sx={{ color: '#FF8E53', animation: `${pulseAnimation} 1.5s infinite ease-in-out` }} />
                        }}
                        disabled={isLoading}
                      />
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
            </CardContent>

            <Divider />

            <CardActions sx={{ p: 3, bgcolor: '#f8f9fa', justifyContent: 'flex-end', gap: 2 }}>
              <UpdateButton
                variant="contained"
                onClick={this.btnUpdateClick}
                disabled={isLoading || !hasChanges || !hasItem || !txtName.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </UpdateButton>
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
            </CardActions>
          </StyledCard>
        </Box>
      </Fade>
    );
  }
}

export default CategoryDetail;