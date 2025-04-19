import React, { Component } from 'react';
import MyContext from './MyContext';
import { toast } from 'react-toastify';

class MyProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: localStorage.getItem('token') || '',
      customer: JSON.parse(localStorage.getItem('customer')) || null,
      apiUrl: process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com/api',
      setToken: this.setToken,
      setCustomer: this.setCustomer,
      handleLogout: this.handleLogout
    };
  }

  setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    this.setState({ token });
  };

  setCustomer = (customer) => {
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer));
    }
    this.setState({ customer });
  };

  handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    this.setState({
      token: '',
      customer: null
    });
    toast.info('Đã đăng xuất thành công');
  };

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;