import React, { Component } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import Menu from './MenuComponent';
import Home from './HomeComponent';
import Category from './CategoryComponent';
import Statistic from './StatisticComponent';
import Product from './ProductComponent';
import Order from './OrderComponent';
// import Customer from './CustomerComponent';

class Main extends Component {
  static contextType = MyContext;

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
              <Route path="/order" element={<Order />} />
              <Route path="/statistic" element={<Statistic />} />
              {/* <Route path="/customer" element={<Customer />} /> */}

            </Routes>
            <Outlet /> {/* Để render các route con */}
          </div>
        </div>
      );
    }
    return <div></div>;
  }
}

export default Main;