import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.scss';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = React.useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    const fetchCart = useCallback(async () => {
        if (!userInfo || !userInfo.token) return;
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            };
            const { data } = await axios.get('/api/cart', config);
            setCartItems(data.items || []);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [userInfo]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        fetchCart();
    }, [navigate, userInfo, fetchCart]);

    const updateCartItem = async (listingId, quantity, daysRented) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.put('/api/cart/update', { listingId, quantity, daysRented }, config);
            setCartItems(data.items || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating cart');
        }
    };

    const removeFromCart = async (listingId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            // Note: axios.delete often requires payload in a 'data' property
            const { data } = await axios.delete('/api/cart/remove', {
                ...config,
                data: { listingId }
            });
            setCartItems(data.items || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Error removing item');
        }
    };

    // Calculate total safely
    const cartTotal = cartItems.reduce((acc, item) => {
        if (!item.listing) return acc;
        const transactionType = item.listing.transactionType || 'Sale';
        const isRent = transactionType.toLowerCase() === 'rent' || item.listing.category === 'Tool';
        if (isRent) {
            return acc + (item.listing.price * item.quantity * (item.daysRented || 1));
        }
        return acc + (item.listing.price * item.quantity);
    }, 0).toFixed(2);

    if (loading) return <div className="loader container">Loading cart...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    return (
        <div className="cart-container container">
            <h2>Your Shopping Cart</h2>

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <p>Your cart is currently empty.</p>
                    <Link to="/" className="btn-primary">Browse Items</Link>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items">
                        {cartItems.map((item) => {
                            if (!item.listing) return null; // Defensive check
                            return (
                                <div key={item.listing._id} className="cart-item">
                                    <div className="item-image">
                                        {item.listing.imageUrl ? (
                                            <img src={item.listing.imageUrl} alt={item.listing.title} />
                                        ) : (
                                            <div className="img-placeholder">No Image</div>
                                        )}
                                    </div>
                                    <div className="item-details">
                                        <Link to={`/listing/${item.listing._id}`}>
                                            <h3>{item.listing.title}</h3>
                                        </Link>
                                        <p className="item-category">{item.listing.category}</p>
                                        <div className="item-price">
                                            ₹{item.listing.price.toFixed(2)}
                                            {((item.listing.transactionType || 'Sale').toLowerCase() === 'rent' || item.listing.category === 'Tool') && ' / day'}
                                        </div>
                                    </div>

                                    <div className="item-actions">
                                        <div className="cart-controls-group">
                                            <div className="control-label">Qty:</div>
                                            <div className="quantity-controls">
                                                <button
                                                    onClick={() => updateCartItem(item.listing._id, item.quantity - 1, item.daysRented || 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartItem(item.listing._id, item.quantity + 1, item.daysRented || 1)}
                                                    disabled={item.quantity >= item.listing.stockCount}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {((item.listing.transactionType || 'Sale').toLowerCase() === 'rent' || item.listing.category === 'Tool') && (
                                            <div className="cart-controls-group">
                                                <div className="control-label">Days:</div>
                                                <div className="quantity-controls days-controls">
                                                    <button
                                                        onClick={() => updateCartItem(item.listing._id, item.quantity, (item.daysRented || 1) - 1)}
                                                        disabled={(item.daysRented || 1) <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <span>{item.daysRented || 1}</span>
                                                    <button
                                                        onClick={() => updateCartItem(item.listing._id, item.quantity, (item.daysRented || 1) + 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            className="btn-remove"
                                            onClick={() => removeFromCart(item.listing._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="cart-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-row total">
                            <span>Subtotal</span>
                            <span>${cartTotal}</span>
                        </div>
                        <p className="checkout-note">Shipping and taxes calculated at checkout.</p>
                        <button className="btn-primary btn-checkout" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
