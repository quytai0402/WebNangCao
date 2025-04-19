import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import Main from './components/MainComponent';
import Footer from './components/FooterComponent';
import MyProvider from './contexts/MyProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <MyProvider>
      <BrowserRouter>
        <div className="App">
          <Main />
          <ToastContainer />
          
          <Footer />
        </div>
      </BrowserRouter>
    </MyProvider>
  );
}

export default App;