import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaHome, FaSortAmountDown } from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';
import '../styles/MenuComponent.css';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';

class Menu extends Component {
    static contextType = MyContext;
    
    constructor(props) {
        super(props);
        this.state = {
            categories: [],
            mobileMenuOpen: false,
            activeCategory: null,
            txtKeyword: '',
            priceRanges: [
                { min: 0, max: 100000, label: 'Dưới 100,000₫' },
                { min: 100000, max: 200000, label: '100,000₫ - 200,000₫' },
                { min: 200000, max: 300000, label: '200,000₫ - 300,000₫' },
                { min: 300000, max: 400000, label: '300,000₫ - 400,000₫' },
                { min: 400000, max: 500000, label: '400,000₫ - 500,000₫' },
                { min: 500000, max: null, label: 'Trên 500,000₫' }
            ]
        };
    }

    componentDidMount() {
        this.fetchCategories();
        // Thêm event listener để đóng dropdown khi click bên ngoài
        document.addEventListener('click', this.handleClickOutside);
    }

    componentWillUnmount() {
        // Dọn dẹp event listener khi component unmount
        document.removeEventListener('click', this.handleClickOutside);
    }

    handleClickOutside = (event) => {
        // Đóng tất cả dropdown nếu click bên ngoài menu
        const dropdowns = document.querySelectorAll('.menu-dropdown');
        if (dropdowns && !event.target.closest('.menu-item-with-dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show-dropdown');
            });
        }
    }

    async fetchCategories() {
        try {
            const response = await axios.get(`${this.context.apiUrl}/customer/categories`);
            if (response && response.data) {
                this.setState({ categories: response.data });
            } else {
                console.error('Invalid response format from categories API');
                this.setState({ categories: [] });
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            this.setState({ categories: [] });
        }
    }

    toggleMobileMenu = () => {
        this.setState(prevState => ({
            mobileMenuOpen: !prevState.mobileMenuOpen
        }));
    }

    handleHomeClick = () => {
        this.setState({
            activeCategory: null,
            mobileMenuOpen: false
        }, () => {
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 100);
        });
    }

    handleCategoryClick = (categoryId) => {
        this.setState({
            activeCategory: this.state.activeCategory === categoryId ? null : categoryId,
            mobileMenuOpen: false
        }, () => {
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 100);
        });
    }

    btnSearchClick(e) {
        e.preventDefault();
        const keyword = this.state.txtKeyword.trim();

        if (keyword) {
            this.setState({ txtKeyword: '' });
            const searchUrl = `/product/search/${keyword}`;

            if (window.location.pathname.includes('/product/search/')) {
                window.location.href = searchUrl;
            } else {
                this.props.router.navigate(searchUrl);
            }
        }
    }

    handlePriceRangeClick = (categoryId, min, max, e) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn chặn event lan ra phần tử cha

        // Điều hướng đến trang danh mục với tham số lọc giá
        // Thay đổi URL format thành /product/category/:id?min=xxx&max=xxx
        const filterUrl = `/product/category/${categoryId}?min=${min}${max ? `&max=${max}` : ''}`;
        this.props.router.navigate(filterUrl);

        // Đóng menu mobile nếu đang mở
        this.setState({ mobileMenuOpen: false });
    }

    render() {
        const { categories, mobileMenuOpen, activeCategory, txtKeyword, priceRanges } = this.state;

        return (
            <nav className={`main-navigation ${this.state.scrolled ? 'scrolled' : ''}`}>
                <div className="nav-wrapper">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="logo-link"
                        onClick={(e) => {
                            e.preventDefault();
                            this.handleHomeClick();
                            this.props.router.navigate('/');
                        }}
                    >
                        <GiFlowerPot className="logo-icon" />
                        <span>Florista</span>
                    </Link>

                    {/* Main Menu */}
                    <ul className={`main-menu ${mobileMenuOpen ? 'active' : ''}`}>
                        <li className="menu-item" style={{ "--i": 1 }}>
                            <Link
                                to="/"
                                className={`menu-link ${window.location.pathname === '/' ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    this.handleHomeClick();
                                    this.props.router.navigate('/');
                                }}
                            >
                                <FaHome className="me-2" />
                                Trang chủ
                            </Link>
                        </li>
                        {categories.map((category, index) => (
                            <li
                                key={category._id}
                                className="menu-item menu-item-with-dropdown"
                                style={{ "--i": index + 2 }}
                            >
                                <Link
                                    to={`/product/category/${category._id}`}
                                    className={`menu-link ${activeCategory === category._id ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        this.handleCategoryClick(category._id);
                                        this.props.router.navigate(`/product/category/${category._id}`);
                                    }}
                                >
                                    {category.name}
                                </Link>
                                <div className="menu-dropdown price-filter-dropdown">
                                    <div className="dropdown-header">
                                        <FaSortAmountDown className="dropdown-icon" />
                                        <span>Lọc giá</span>
                                    </div>
                                    <div className="dropdown-divider"></div>

                                    {priceRanges.map((range, idx) => (
                                        <Link
                                            key={idx}
                                            to={`/product/category/${category._id}?min=${range.min}${range.max ? `&max=${range.max}` : ''}`}
                                            className="dropdown-item"
                                            onClick={(e) => this.handlePriceRangeClick(category._id, range.min, range.max, e)}
                                        >
                                            {range.label}
                                        </Link>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Search */}
                    <div className="search-container">
                        <form onSubmit={(e) => this.btnSearchClick(e)}>
                            <input
                                type="search"
                                placeholder="Tìm kiếm hoa..."
                                className="search-input"
                                value={txtKeyword}
                                onChange={(e) => this.setState({ txtKeyword: e.target.value })}
                            />
                            <button type="submit" className="search-button" aria-label="Tìm kiếm">
                                <FaSearch />
                            </button>
                        </form>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={this.toggleMobileMenu}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>
        );
    }
}

export default withRouter(Menu);