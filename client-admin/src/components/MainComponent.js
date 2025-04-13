import React, { Component } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import Menu from './MenuComponent';
import Home from './HomeComponent';
import Category from './CategoryComponent';
import Statistic from './StatisticComponent';
import Product from './ProductComponent';
import ProductDetail from './ProductDetailComponent';
import Order from './OrderComponent';
import CommentComponent from './CommentComponent';
// import Customer from './CustomerComponent';

class Main extends Component {
  static contextType = MyContext;

  componentDidMount() {
    // Validate token when component mounts
    if (this.context.token) {
      this.context.validateToken();
    }
  }

  render() {
    if (this.context.token !== '') {
      return (
        <div className="d-flex">
          <Menu />
          <div className="body-admin" style={{ marginLeft: '275px', width: '100%' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category" element={<Category />} />
              <Route path="/product" element={<Product />} />
              <Route path="/product/detail/:id" element={<ProductDetail />} />
              <Route path="/order" element={<Order />} />
              <Route path="/statistic" element={<Statistic />} />
              <Route path="/comment" element={<CommentComponent />} />
              {/* <Route path="/customer" element={<Customer />} /> */}
            </Routes>
            <Outlet /> {/* Để render các route con */}
          </div>
        </div>
      );
    }
    return <Navigate to="/" />;
  }
}

export default Main;