import { FaEye, FaEdit, FaPlus, FaTrash, FaImage, FaBox, FaTag, FaDollarSign, FaFolder, FaFileAlt, FaEraser } from 'react-icons/fa';
import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import { Card, Form, Button, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '../styles/ProductDetailComponent.css';
class ProductDetail extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      txtID: '',
      txtName: '',
      txtPrice: 0,
      cmbCategory: '',
      imgProduct: '',
      txtDescription: '',
      errors: {
        name: '',
        price: '',
        category: '',
        image: '',
        description: ''
      }
    };
  }

  componentDidMount() {
    this.apiGetCategories();
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      const item = this.props.item || {};
      
      // Nếu có item và có ID, gọi API để lấy thông tin đầy đủ
      if (item._id) {
        this.fetchProductDetails(item._id);
      } else {
        // Xử lý image url
        let imageUrl = '';
        if (item.image) {
          // Nếu image là base64
          if (item.image.includes('base64')) {
            imageUrl = item.image;
          }
          // Nếu image là URL
          else if (item.image.startsWith('http')) {
            imageUrl = item.image;
          }
          // Nếu image là string base64 không có prefix
          else {
            imageUrl = `data:image/jpeg;base64,${item.image}`;
          }
        }
    
        this.setState({
          txtID: item._id || '',
          txtName: item.name || '',
          txtPrice: item.price || 0,
          cmbCategory: item.category?._id || '',
          imgProduct: imageUrl,
          txtDescription: item.description || '',
          errors: {
            name: '',
            price: '',
            category: '',
            image: '',
            description: ''
          },
          hasChanges: false
        });
      }
    }
  }

  validateForm = () => {
    const { txtName, txtPrice, cmbCategory, imgProduct, txtID } = this.state;
    let isValid = true;
    const errors = {
      name: '',
      price: '',
      category: '',
      image: '',
      description: ''
    };

    // Validate name
    if (!txtName.trim()) {
      errors.name = 'Tên sản phẩm không được để trống';
      isValid = false;
    }

    // Validate price
    if (!txtPrice || txtPrice <= 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn 0';
      isValid = false;
    }

    // Validate category
    if (!cmbCategory) {
      errors.category = 'Vui lòng chọn danh mục';
      isValid = false;
    }

    // Validate image when adding new product
    if (!txtID && !imgProduct) {
      errors.image = 'Vui lòng chọn hình ảnh sản phẩm';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  };

  apiGetCategories() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get(`${this.context.apiUrl}/admin/categories`, config)
      .then((res) => {
        const result = res.data;
        const categories = Array.isArray(result.categories) ? result.categories : [];
        this.setState({ categories: categories });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        this.setState({ categories: [] });
      });
  }

  previewImage(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.setState({
          imgProduct: evt.target.result,
          errors: { ...this.state.errors, image: '' }
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // Sửa lại hàm btnAddClick
  // Thay thế hàm btnAddClick hiện tại bằng hàm mới
  // ProductDetailComponent.js
btnAddClick = async (e) => {
  e.preventDefault();
  if (!this.validateForm()) return;

  try {
    // Hiển thị loading state
    this.setState({ isLoading: true });
    
    const formData = new FormData();
    formData.append('name', this.state.txtName);
    formData.append('price', this.state.txtPrice);
    formData.append('category', this.state.cmbCategory);
    formData.append('description', this.state.txtDescription);

    if (this.state.imgProduct) {
      const imageFile = await fetch(this.state.imgProduct).then(r => r.blob());
      formData.append('image', imageFile);
    }

    console.log('Sending product data to server...');
    const response = await axios.post(`${this.context.apiUrl}/admin/products`, formData, {
      headers: {
        'x-access-token': this.context.token,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Server response:', response.data);
    if (response.data.success) {
      toast.success(response.data.message || 'Thêm sản phẩm thành công!');
      // Reset form
      this.setState({
        txtName: '',
        txtPrice: 0,
        cmbCategory: '',
        imgProduct: '',
        txtDescription: '',
        errors: {}
      });
      
      // Cập nhật danh sách sản phẩm mà không reload trang
      if (this.props.updateProducts) {
        this.props.updateProducts();
      }
    } else {
      toast.error(response.data.message || 'Thêm sản phẩm thất bại');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
  } finally {
    this.setState({ isLoading: false });
  }
};

  // Sửa lại hàm btnUpdateClick
  // ProductDetailComponent.js
btnUpdateClick = async (e) => {
  e.preventDefault();
  if (!this.validateForm()) return;

  this.setState({ isLoading: true });
  try {
    const { txtID, txtName, txtPrice, cmbCategory, imgProduct, txtDescription } = this.state;

    const prod = {
      name: txtName.trim(),
      price: parseInt(txtPrice),
      category: cmbCategory,
      description: txtDescription
    };

    // Chỉ gửi image nếu có thay đổi
    if (imgProduct && imgProduct.includes('data:image')) {
      prod.image = imgProduct.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    const response = await axios.put(
      `${this.context.apiUrl}/admin/products/${txtID}`,
      prod,
      { headers: { 'x-access-token': this.context.token } }
    );

    if (response.data.success) {
      toast.success('Cập nhật sản phẩm thành công!');
      // Cập nhật UI ngay lập tức
      if (this.props.updateProducts) {
        this.props.updateProducts();
      }
    }
  } catch (error) {
    toast.error('Lỗi cập nhật: ' + error.message);
  } finally {
    this.setState({ isLoading: false });
  }
};
  // Sửa lại hàm btnDeleteClick
  // ProductDetailComponent.js
btnDeleteClick = async (e) => {
  e.preventDefault();
  const { txtID } = this.state;
  if (!txtID) return;

  if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    this.setState({ isLoading: true });
    try {
      const response = await axios.delete(`${this.context.apiUrl}/admin/products/${txtID}`, {
        headers: { 'x-access-token': this.context.token }
      });

      if (response.data.success) {
        toast.success('Xóa sản phẩm thành công!');
        // Reset form
        this.setState({
          txtName: '',
          txtPrice: 0,
          cmbCategory: '',
          imgProduct: '',
          txtDescription: '',
          errors: {},
          isLoading: false
        });
        
        // Cập nhật UI ngay lập tức
        if (this.props.updateProducts) {
          this.props.updateProducts();
        }
      }
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm: ' + error.message);
      this.setState({ isLoading: false });
    }
  }
};

  apiPostProduct(prod) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.post(`${this.context.apiUrl}/admin/products`, prod, config)
      .then((res) => {
        const result = res.data;
        if (result) {
          toast.success('Thêm sản phẩm thành công!');
          
          // Clear cache in any customer tabs that might be open
          if (window.opener) {
            try {
              // Notify parent window to clear cache
              window.opener.postMessage({ type: 'PRODUCT_ADDED' }, '*');
            } catch (e) {
              console.error('Error posting message to parent window:', e);
            }
          }
          
          // Update products list
          if (this.props.updateProducts) {
            this.props.updateProducts();
          }
          
          // Reset form
          this.setState({
            txtName: '',
            txtPrice: 0,
            cmbCategory: '',
            imgProduct: '',
            txtDescription: '',
            errors: {
              name: '',
              price: '',
              category: '',
              image: '',
              description: ''
            }
          });
        }
      })
      .catch(error => {
        console.error("Error adding product:", error);
        toast.error('Đã có lỗi xảy ra khi thêm sản phẩm');
      });
  }

  apiPutCategory = async (id, category) => {
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.put(`/api/admin/categories/${id}`, category, config);

      if (response.data.success) {
        toast.success('Cập nhật danh mục thành công!');
        this.setState({ hasChanges: false });
        // Sử dụng Promise để đảm bảo timing
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.reload();
      } else {
        // Nếu server trả về success: false
        throw new Error(response.data.message);
      }
    } catch (error) {
      // Chỉ hiển thị một thông báo lỗi
      const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
      toast.error('Lỗi cập nhật: ' + errorMessage);
    }
  };

  apiDeleteProduct = async (id) => {
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.delete('/api/admin/products/' + id, config);

      if (response.data) {
        toast.success('Xóa sản phẩm thành công!');
        this.setState({ product: null });
        // Đợi toast hiển thị xong
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.reload();
      } else {
        throw new Error('Xóa sản phẩm thất bại');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error('Lỗi: ' + errorMessage);
    }
  };

  apiGetProducts() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/products?page=' + this.props.curPage, config)
      .then((res) => {
        const result = res.data;
        if (result.products.length !== 0) {
          this.props.updateProducts(result.products, result.noPages);
        }
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        toast.error('Đã có lỗi xảy ra khi tải danh sách sản phẩm');
      });
  }

  // Thêm phương thức để lấy thông tin chi tiết sản phẩm
  fetchProductDetails = async (productId) => {
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const response = await axios.get(`/api/admin/products/${productId}`, config);
      
      if (response.data.success) {
        const product = response.data.product;
        console.log('Fetched product details:', product);
        
        // Xử lý image url
        let imageUrl = '';
        if (product.image) {
          // Nếu image là base64
          if (product.image.includes('base64')) {
            imageUrl = product.image;
          }
          // Nếu image là URL
          else if (product.image.startsWith('http')) {
            imageUrl = product.image;
          }
          // Nếu image là string base64 không có prefix
          else {
            imageUrl = `data:image/jpeg;base64,${product.image}`;
          }
        }
        
        this.setState({
          txtID: product._id || '',
          txtName: product.name || '',
          txtPrice: product.price || 0,
          cmbCategory: product.category?._id || '',
          imgProduct: imageUrl,
          txtDescription: product.description || '',
          errors: {
            name: '',
            price: '',
            category: '',
            image: '',
            description: ''
          },
          hasChanges: false
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Có lỗi khi tải thông tin chi tiết sản phẩm');
    }
  }

  // Thêm hàm btnClearClick để xóa toàn bộ thông tin
  btnClearClick = (e) => {
    e.preventDefault();
    this.setState({
      txtID: '',
      txtName: '',
      txtPrice: 0,
      cmbCategory: '',
      imgProduct: '',
      txtDescription: '',
      errors: {
        name: '',
        price: '',
        category: '',
        image: '',
        description: ''
      }
    });
    toast.info('Đã xóa thông tin sản phẩm');
  };

  render() {
    const { categories, txtID, txtName, txtPrice, cmbCategory, imgProduct, txtDescription, errors } = this.state;

    return (
      <Card className="product-detail-card shadow-sm border-0 h-100">
        <Card.Header
          className="flower-gradient text-white py-3"
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <FaBox className="me-2" size={20} />
              <h5 className="mb-0">Chi Tiết Sản Phẩm</h5>
            </div>
            <Button
              variant="light"
              size="sm"
              className="clear-header-button"
              onClick={this.btnClearClick}
              title="Xóa thông tin sản phẩm"
            >
              <FaEraser size={14} />
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          <Form>
            <Form.Group className="mb-3 detail-group">
              <Form.Label className="detail-label">
                <FaTag className="me-2" />
                ID
              </Form.Label>
              <Form.Control
                type="text"
                value={txtID}
                readOnly
                className="detail-input-readonly"
              />
            </Form.Group>

            <Form.Group className="mb-3 detail-group">
              <Form.Label className="detail-label">
                <FaEye className="me-2" />
                Tên Sản Phẩm
              </Form.Label>
              <Form.Control
                type="text"
                value={txtName}
                onChange={(e) => this.setState({
                  txtName: e.target.value,
                  errors: { ...errors, name: '' }
                })}
                placeholder="Nhập tên sản phẩm"
                className="detail-input"
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 detail-group">
              <Form.Label className="detail-label">
                <FaDollarSign className="me-2" />
                Giá
              </Form.Label>
              <Form.Control
                type="number"
                value={txtPrice}
                onChange={(e) => this.setState({
                  txtPrice: e.target.value,
                  errors: { ...errors, price: '' }
                })}
                placeholder="Nhập giá sản phẩm"
                className="detail-input"
                isInvalid={!!errors.price}
              />
              <Form.Control.Feedback type="invalid">
                {errors.price}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 detail-group">
              <Form.Label className="detail-label">
                <FaFolder className="me-2" />
                Danh Mục
              </Form.Label>
              <Form.Select
                value={cmbCategory}
                onChange={(e) => this.setState({
                  cmbCategory: e.target.value,
                  errors: { ...errors, category: '' }
                })}
                className="detail-select"
                isInvalid={!!errors.category}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cate) => (
                  <option key={cate._id} value={cate._id}>
                    {cate.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.category}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 detail-group">
              <Form.Label className="detail-label">
                <FaFileAlt className="me-2" />
                Mô tả
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={txtDescription}
                onChange={(e) => this.setState({
                  txtDescription: e.target.value,
                  errors: { ...errors, description: '' }
                })}
                placeholder="Nhập mô tả sản phẩm"
                className="detail-input"
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4 detail-group">
              <Form.Label className="detail-label">
                <FaImage className="me-2" />
                Hình Ảnh
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => this.previewImage(e)}
                className="detail-file-input"
                isInvalid={!!errors.image}
              />
              <Form.Control.Feedback type="invalid">
                {errors.image}
              </Form.Control.Feedback>
              {imgProduct && (
                <div className="image-preview">
                  <Image
                    src={imgProduct}
                    alt="Product Preview"
                    className="preview-image"
                    onError={(e) => {
                      console.error("Image loading error:", e);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </Form.Group>

            <div className="action-buttons">
              <Button
                variant="success"
                className="action-button add-button"
                onClick={this.btnAddClick}
              >
                <FaPlus className="me-2" />
                Thêm Mới
              </Button>
              <Button
                variant="primary"
                className="action-button update-button"
                onClick={this.btnUpdateClick}
                disabled={!txtID}
              >
                <FaEdit className="me-2" />
                Cập Nhật
              </Button>
              <Button
                variant="danger"
                className="action-button delete-button"
                onClick={this.btnDeleteClick}
                disabled={!txtID}
              >
                <FaTrash className="me-2" />
                Xóa
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    );
  }
}

export default ProductDetail;
