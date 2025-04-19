import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = () => (
    <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải...</p>
    </div>
);

export default LoadingSpinner;