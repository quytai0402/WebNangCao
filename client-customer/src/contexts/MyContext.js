import React from 'react';
// Tạo Context API để quản lý trạng thái toàn cục cho ứng dụng
// Đặt các giá trị mặc định cho context
const MyContext = React.createContext({
  token: '', // Token xác thực người dùng
  customer: null, // Thông tin khách hàng
  setToken: () => {}, // Hàm cập nhật token
  setCustomer: () => {} // Hàm cập nhật thông tin khách hàng
});

// MyProvider component - Cung cấp state và các phương thức cho toàn bộ ứng dụng
export class MyProvider extends React.Component {
  constructor(props) {
    super(props);
    // Khởi tạo state với dữ liệu từ localStorage (nếu có)
    this.state = {
      token: localStorage.getItem('token') || '', // Lấy token từ localStorage hoặc chuỗi rỗng nếu không tồn tại
      customer: JSON.parse(localStorage.getItem('customer')) || null, // Lấy thông tin khách hàng từ localStorage hoặc null
      setToken: this.setToken, // Truyền hàm setToken vào state để các component con có thể gọi
      setCustomer: this.setCustomer // Truyền hàm setCustomer vào state để các component con có thể gọi
    };
  }

  // Phương thức cập nhật token
  // Được sử dụng khi đăng nhập, đăng xuất hoặc làm mới token
  setToken = (token) => {
    this.setState({ token }); // Cập nhật trạng thái token trong React
    if (token) {
      localStorage.setItem('token', token); // Lưu token mới vào localStorage
    } else {
      localStorage.removeItem('token'); // Xóa token khỏi localStorage khi đăng xuất
    }
  };

  // Phương thức cập nhật thông tin khách hàng
  // Được sử dụng khi đăng nhập, đăng xuất hoặc cập nhật thông tin cá nhân
  setCustomer = (customer) => {
    this.setState({ customer }); // Cập nhật trạng thái customer trong React
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer)); // Lưu thông tin khách hàng dưới dạng JSON string vào localStorage
    } else {
      localStorage.removeItem('customer'); // Xóa thông tin khách hàng khỏi localStorage khi đăng xuất
    }
  };

  // Render Provider bao bọc các component con và cung cấp giá trị context
  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children} {/* Render tất cả các component con được bao bọc */}
      </MyContext.Provider>
    );
  }
}

// Export MyContext để các component con có thể sử dụng thông qua useContext hoặc Consumer
export default MyContext;