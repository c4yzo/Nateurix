import React from 'react';
import { Link } from 'react-router-dom';
import '../OrderSuccess/OrderSuccess.scss';

const OrderFailed = () => {
    return (
        <div className="order-success-container container">
            <div className="success-card" style={{ borderTop: '5px solid #e74c3c' }}>
                <div className="icon-wrapper" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)' }}>
                    <span className="success-icon" style={{ color: '#e74c3c' }}>✕</span>
                </div>
                <h2>Payment Failed</h2>
                <p>We couldn't process your payment. No charges were made.</p>
                <div className="order-details">
                    <p className="note" style={{ fontStyle: 'normal' }}>Please check your card details or try a different payment method.</p>
                </div>

                <div className="action-buttons">
                    <Link to="/cart" className="btn-secondary" style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>Return to Cart</Link>
                    <Link to="/checkout" className="btn-primary" style={{ backgroundColor: '#e74c3c' }}>Try Again</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderFailed;
