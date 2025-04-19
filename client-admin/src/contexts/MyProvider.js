import React, { Component } from 'react';
import MyContext from './MyContext';
import axios from 'axios';

class MyProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: localStorage.getItem('token') || '',
      username: localStorage.getItem('username') || '',
      apiUrl: `${process.env.REACT_APP_API_URL || 'https://webnangcao-api.onrender.com'}/api`,
      setToken: this.setToken,
      setUsername: this.setUsername,
      validateToken: this.validateToken
    };
  }

  componentDidMount() {
    if (this.state.token) {
      this.validateToken();
    }
  }

  validateToken = async () => {
    try {
      console.log('Validating token:', this.state.token);
      const response = await axios.get(
        `${this.state.apiUrl}/admin/token`,
        { headers: { 'Authorization': `Bearer ${this.state.token}` } }
      );
      
      console.log('Token validation response:', response.data);
      
      if (!response.data || !response.data.success) {
        console.log('Token invalid, clearing...');
        this.setToken('');
        this.setUsername('');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.setToken('');
      this.setUsername('');
      return false;
    }
  }

  setToken = (value) => {
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
    this.setState({ token: value });
  }

  setUsername = (value) => {
    if (value) {
      localStorage.setItem('username', value);
    } else {
      localStorage.removeItem('username');
    }
    this.setState({ username: value });
  }

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;