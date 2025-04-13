import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MyProvider from './contexts/MyProvider';
import Login from './components/LoginComponent';
import Main from './components/MainComponent';
import CustomerComponent from './components/CustomerComponent'; 
import RequireAuth from './components/RequireAuth'; // 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS

function App() {
  return (
    <MyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/*" element={<Main />}>
            {/* Thêm các routes con vào đây */}
            <Route path="customer" element={
              <RequireAuth>
                <CustomerComponent />
              </RequireAuth>
            } />
          </Route>
        </Routes>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          limit={3}
        />
      </BrowserRouter>
    </MyProvider>
  );
}

export default App;
