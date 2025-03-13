import React, { Component } from 'react';
import MyContext from './MyContext';

class MyProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: localStorage.getItem('token') || '',
      username: localStorage.getItem('username') || '',
      setToken: this.setToken,
      setUsername: this.setUsername,
    };
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