import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './OrderSuccess.scss';

const OrderSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = React.useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        }
    }, [navigate, userInfo]);

    return (
        <div className="order-success-container container">
            <div className="success-card">
                <div className="icon-wrapper">
                    <span className="success-icon">✓</span>
                </div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your order. We are currently processing it.</p>
                <div className="order-details">
                    <p>Order ID: <strong>{id}</strong></p>
                    <p className="note">Your seller has been notified and will prepare your items for shipment or renting.</p>
                </div>

                <div className="action-buttons">
                    <Link to="/my-ads" className="btn-secondary">View My Account</Link>
                    <Link to="/" className="btn-primary">Continue Browsing</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
