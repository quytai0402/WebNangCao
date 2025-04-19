import '../styles/CategoryComponent.css';
import React, { Component } from 'react';
import axios from 'axios';
import MyContext from '../contexts/MyContext';
import CategoryDetail from './CategoryDetailComponent';
import { toast } from 'react-toastify';
import {
    Container,
    Grid,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
    Fade,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Badge,
    Chip,
    Avatar,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Category as CategoryIcon,
    LocalFlorist as FlowerIcon,
    Search as SearchIcon,
    Bookmark as BookmarkIcon,
    FilterList as FilterListIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    Delete as DeleteIcon,
    CheckCircleOutline as CheckIcon,
    Tag as TagIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const breatheAnimation = keyframes`
  0% { box-shadow: 0 10px 30px rgba(255, 107, 107, 0.1); }
  50% { box-shadow: 0 15px 40px rgba(255, 142, 83, 0.2); }
  100% { box-shadow: 0 10px 30px rgba(255, 107, 107, 0.1); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled Components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent',
    '&:nth-of-type(odd)': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    '&:hover': {
        backgroundColor: `${theme.palette.primary.main}10`,
        transform: 'translateX(6px)',
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        '& .MuiTableCell-root': {
            color: theme.palette.primary.main
        }
    },
    '&.Mui-selected': {
        backgroundColor: `${theme.palette.primary.main}15`,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        '&:hover': {
            backgroundColor: `${theme.palette.primary.main}20`,
        }
    }
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    overflow: 'visible',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    animation: `${fadeIn} 0.6s ease-out, ${breatheAnimation} 4s infinite ease-in-out`,
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 15px 35px rgba(255, 107, 107, 0.2)'
    }
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: '#f8f9fa'
        },
        '&.Mui-focused': {
            backgroundColor: 'white',
            boxShadow: '0 0 0 2px rgba(255, 107, 107, 0.2)'
        },
        '& fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.1)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255, 107, 107, 0.5)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#FF6B6B',
        }
    }
});

const CategoryBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#FF6B6B',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        padding: '0 8px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)',
    }
}));

const EmptyPlaceholder = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
    color: '#9e9e9e',
    '& svg': {
        fontSize: 60,
        marginBottom: theme.spacing(2),
        color: '#FF8E53',
        animation: `${floatAnimation} 3s infinite ease-in-out`
    }
}));

const CategoryAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
    color: '#FF8E53',
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginRight: theme.spacing(1.5),
    boxShadow: '0 2px 8px rgba(255, 142, 83, 0.2)',
    '& svg': {
        fontSize: '1.2rem',
    }
}));

const TableContainer = styled(Paper)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
    boxShadow: 'none',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    height: 400,
    overflowY: 'auto',
    position: 'relative',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#e0e0e0',
        borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: '#FF8E53',
    },
}));

const GradientHeader = styled(CardHeader)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    color: 'white',
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
    }
}));

const ActionButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1, 3),
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 15px rgba(255, 107, 107, 0.4)',
    },
    '&:active': {
        transform: 'translateY(0)',
    }
}));

const SortIcon = styled(Box)(({ active, direction }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px',
    color: active ? '#FF6B6B' : 'rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
}));

class Category extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            categories: [],
            itemSelected: null,
            errorMessage: null,
            newCategoryName: '',
            isLoading: false,
            isSubmitting: false,
            searchTerm: '',
            sortField: 'name', // Thêm trường sắp xếp
            sortDirection: 'asc' // Mặc định sắp xếp tăng dần
        };
    }

    componentDidMount() {
        this.apiGetCategories();
    }

    apiGetCategories = () => {
        this.setState({ isLoading: true });
        const config = { headers: { 'x-access-token': this.context.token } };

        axios.get(`${this.context.apiUrl}/admin/categories`, config)
            .then((res) => {
                const data = res.data;
                if (data.success) {
                    this.setState({
                        categories: data.categories,
                        errorMessage: null
                    });
                } else {
                    throw new Error(data.message);
                }
            })
            .catch((error) => {
                console.error('Error fetching categories:', error);
                toast.error('Không thể tải danh sách danh mục');
                this.setState({
                    errorMessage: 'Không thể tải danh sách danh mục',
                    categories: []
                });
            })
            .finally(() => {
                this.setState({ isLoading: false });
            });
    };

    trItemClick = (item) => {
        this.setState({ itemSelected: item });
        toast.info(`Đã chọn danh mục: ${item.name}`, {
            position: "bottom-right",
            autoClose: 2000
        });
    };

    handleAddCategory = async (e) => {
        e.preventDefault();
        const { newCategoryName } = this.state;

        if (!newCategoryName.trim()) {
            toast.warning('Vui lòng nhập tên danh mục');
            return;
        }

        this.setState({ isSubmitting: true });

        try {
            const response = await axios.post(`${this.context.apiUrl}/admin/categories`,
                { name: newCategoryName },
                { headers: { 'x-access-token': this.context.token } }
            );

            if (response.data.success) {
                toast.success('Đã thêm danh mục mới', {
                    icon: '🌸'
                });
                this.setState({ newCategoryName: '' });
                this.apiGetCategories();
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Không thể thêm danh mục mới');
        } finally {
            this.setState({ isSubmitting: false });
        }
    };

    updateCategories = () => {
        this.apiGetCategories();
    };

    handleSearchChange = (e) => {
        this.setState({ searchTerm: e.target.value });
    };

    toggleSort = (field) => {
        this.setState(prevState => ({
            sortField: field,
            sortDirection: prevState.sortField === field && prevState.sortDirection === 'asc' ? 'desc' : 'asc'
        }));
    };

    getFilteredCategories = () => {
        const { categories, searchTerm, sortField, sortDirection } = this.state;
        if (!categories) return [];
        
        // Lọc danh sách theo từ khóa tìm kiếm
        const filtered = categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category._id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Sắp xếp danh sách
        return [...filtered].sort((a, b) => {
            const valueA = a[sortField] ? a[sortField].toLowerCase() : '';
            const valueB = b[sortField] ? b[sortField].toLowerCase() : '';
            
            if (sortDirection === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        });
    };

    render() {
        const { 
            errorMessage, 
            newCategoryName, 
            isLoading, 
            isSubmitting, 
            itemSelected, 
            searchTerm, 
            sortField, 
            sortDirection 
        } = this.state;
        
        const filteredCategories = this.getFilteredCategories();

        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={500}>
                            <AnimatedCard>
                                <GradientHeader
                                    title={
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <FlowerIcon fontSize="large" sx={{ color: '#fff', animation: `${floatAnimation} 3s infinite ease-in-out` }} />
                                                <Box>
                                                    <Typography variant="h5" fontWeight="bold">
                                                        Danh Mục Hoa
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                        Quản lý tất cả danh mục sản phẩm
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CategoryBadge badgeContent={filteredCategories.length} color="primary">
                                                    <CategoryIcon />
                                                </CategoryBadge>
                                                <Tooltip title="Làm mới danh sách">
                                                    <IconButton
                                                        onClick={this.apiGetCategories}
                                                        disabled={isLoading}
                                                        sx={{ 
                                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                                            },
                                                            transition: 'all 0.3s ease',
                                                            transform: isLoading ? 'rotate(180deg)' : 'rotate(0)',
                                                        }}
                                                    >
                                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    }
                                    sx={{
                                        padding: '16px 20px'
                                    }}
                                />
                                <Box px={3} pt={3} pb={2}>
                                    <StyledTextField
                                        fullWidth
                                        placeholder="Tìm kiếm danh mục..."
                                        value={searchTerm}
                                        onChange={this.handleSearchChange}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1 }} />,
                                            endAdornment: searchTerm && (
                                                <IconButton size="small" onClick={() => this.setState({ searchTerm: '' })}>
                                                    <Tooltip title="Xóa tìm kiếm">
                                                        <RefreshIcon fontSize="small" />
                                                    </Tooltip>
                                                </IconButton>
                                            )
                                        }}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                                <CardContent>
                                    {errorMessage && (
                                        <Alert
                                            severity="error"
                                            sx={{ mb: 2, borderRadius: 2 }}
                                        >
                                            {errorMessage}
                                        </Alert>
                                    )}
                                    
                                    <TableContainer>
                                        {isLoading && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    zIndex: 1
                                                }}
                                            >
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <CircularProgress sx={{ color: '#FF6B6B' }} />
                                                    <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                                                        Đang tải danh mục...
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        
                                        {filteredCategories.length > 0 ? (
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 600,
                                                                backgroundColor: '#f8f9fa',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => this.toggleSort('_id')}
                                                        >
                                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                <Box display="flex" alignItems="center">
                                                                    Mã Danh Mục
                                                                    <SortIcon active={sortField === '_id'} direction={sortDirection}>
                                                                        {sortDirection === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                                                                    </SortIcon>
                                                                </Box>
                                                                <FilterListIcon fontSize="small" sx={{ opacity: 0.5 }} />
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 600,
                                                                backgroundColor: '#f8f9fa',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => this.toggleSort('name')}
                                                        >
                                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                                <Box display="flex" alignItems="center">
                                                                    Tên Danh Mục
                                                                    <SortIcon active={sortField === 'name'} direction={sortDirection}>
                                                                        {sortDirection === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                                                                    </SortIcon>
                                                                </Box>
                                                                <FilterListIcon fontSize="small" sx={{ opacity: 0.5 }} />
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredCategories.map((item) => (
                                                        <StyledTableRow
                                                            key={item._id}
                                                            onClick={() => this.trItemClick(item)}
                                                            selected={itemSelected?._id === item._id}
                                                        >
                                                            <TableCell sx={{ color: '#666' }}>
                                                                <Chip 
                                                                    label={item._id}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ 
                                                                        borderColor: 'rgba(0, 0, 0, 0.1)',
                                                                        fontSize: '0.75rem',
                                                                        padding: '0.1rem',
                                                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                                                        transition: 'all 0.3s ease',
                                                                        '&:hover': {
                                                                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                                                            borderColor: 'rgba(255, 107, 107, 0.3)',
                                                                        }
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <CategoryAvatar>
                                                                        <BookmarkIcon fontSize="small" />
                                                                    </CategoryAvatar>
                                                                    <Typography fontWeight="500">
                                                                        {item.name}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                        </StyledTableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <EmptyPlaceholder>
                                                <CategoryIcon />
                                                <Typography variant="h6">Không tìm thấy danh mục</Typography>
                                                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                                    {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Chưa có danh mục nào. Thêm danh mục mới để bắt đầu!"}
                                                </Typography>
                                                {searchTerm && (
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small" 
                                                        onClick={() => this.setState({ searchTerm: '' })}
                                                        sx={{ 
                                                            mt: 2, 
                                                            borderRadius: '12px',
                                                            borderColor: '#FF6B6B',
                                                            color: '#FF6B6B',
                                                            '&:hover': {
                                                                borderColor: '#FF8E53',
                                                                backgroundColor: 'rgba(255, 142, 83, 0.1)'
                                                            }
                                                        }}
                                                    >
                                                        Xóa tìm kiếm
                                                    </Button>
                                                )}
                                            </EmptyPlaceholder>
                                        )}
                                    </TableContainer>
                                </CardContent>
                                <Divider />
                                <CardActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                                    <Box
                                        component="form"
                                        onSubmit={this.handleAddCategory}
                                        sx={{
                                            width: '100%',
                                            display: 'flex',
                                            gap: 2
                                        }}
                                    >
                                        <StyledTextField
                                            fullWidth
                                            placeholder="Nhập tên danh mục mới..."
                                            value={newCategoryName}
                                            onChange={(e) => this.setState({
                                                newCategoryName: e.target.value
                                            })}
                                            disabled={isSubmitting}
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <CategoryAvatar sx={{ width: 24, height: 24, mr: 1 }}>
                                                        <BookmarkIcon fontSize="small" />
                                                    </CategoryAvatar>
                                                ),
                                            }}
                                        />
                                        <ActionButton
                                            type="submit"
                                            variant="contained"
                                            disabled={isSubmitting || !newCategoryName.trim()}
                                            startIcon={isSubmitting ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                <AddIcon />
                                            )}
                                            sx={{
                                                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)'
                                                },
                                                '&:disabled': {
                                                    background: '#e0e0e0',
                                                    color: '#9e9e9e'
                                                }
                                            }}
                                        >
                                            Thêm Mới
                                        </ActionButton>
                                    </Box>
                                </CardActions>
                            </AnimatedCard>
                        </Fade>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={800}>
                            <div>
                                <CategoryDetail
                                    item={itemSelected}
                                    updateCategories={this.updateCategories}
                                />
                            </div>
                        </Fade>
                    </Grid>
                </Grid>
            </Container>
        );
    }
}

export default Category;