import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import './Checkout.scss';

const Checkout = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        address: '',
        city: '',
        postalCode: '',
        country: 'India',
    });
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState(null); // Holds orderId & transactionId from backend

    const navigate = useNavigate();
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = React.useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchCart = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                };
                const { data } = await axios.get('/api/cart', config);
                setCartItems(data.items || []);

                if (!data.items || data.items.length === 0) {
                    navigate('/cart'); // Don't checkout an empty cart
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to load cart for checkout');
                setLoading(false);
            }
        };
        fetchCart();
    }, [navigate, userInfo]); // userInfo is memoized, so this is safe now

    const handleInputChange = (e) => {
        setShippingAddress({
            ...shippingAddress,
            [e.target.name]: e.target.value
        });
    };

    const cartTotal = cartItems.reduce((acc, item) => {
        if (!item.listing) return acc;
        const transactionType = item.listing.transactionType || 'Sale';
        const daysRented = item.daysRented || 1;

        if (transactionType.toLowerCase() === 'rent') {
            return acc + (item.listing.price * item.quantity * daysRented);
        } else {
            return acc + (item.listing.price * item.quantity);
        }
    }, 0).toFixed(2);

    const handleProceedToPayment = async (e) => {
        e.preventDefault();

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // 1. Send address to backend, get back a formal Order ID and Transaction ID
            const { data } = await axios.post('/api/orders/checkout', { shippingAddress }, config);

            setCheckoutData(data); // { orderId, transactionId, totalPrice }
            setPaymentModalOpen(true); // 2. Open our mock payment gateway overlay

        } catch (err) {
            alert(err.response?.data?.message || 'Error initializing checkout');
        }
    };

    if (loading) return <div className="loader container">Loading checkout...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    return (
        <div className="checkout-container container">
            <h2>Secure Checkout</h2>

            <div className="checkout-layout">
                {/* Left Side: Address Form */}
                <div className="checkout-form-section">
                    <div className="glass-panel">
                        <h3>Shipping Details</h3>
                        <form onSubmit={handleProceedToPayment}>
                            <div className="form-group">
                                <label htmlFor="address">Street Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    required
                                    value={shippingAddress.address}
                                    onChange={handleInputChange}
                                    placeholder="123 Main St, Apt 4B"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label htmlFor="city">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        required
                                        value={shippingAddress.city}
                                        onChange={handleInputChange}
                                        placeholder="San Francisco"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label htmlFor="postalCode">Postal Code</label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        name="postalCode"
                                        required
                                        value={shippingAddress.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="94105"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="country">Country</label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    required
                                    value={shippingAddress.country}
                                    onChange={handleInputChange}
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#777' }}
                                />
                            </div>

                            <button type="submit" className="btn-primary btn-pay">
                                Continue to Payment
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className="checkout-summary-section">
                    <div className="summary-card">
                        <h3>Order Summary</h3>

                        <div className="summary-items">
                            {cartItems.map(item => {
                                if (!item.listing) return null;
                                const transactionType = item.listing.transactionType || 'Sale';
                                const isRent = transactionType.toLowerCase() === 'rent';
                                const itemTotal = isRent
                                    ? (item.listing.price * item.quantity * (item.daysRented || 1)).toFixed(2)
                                    : (item.listing.price * item.quantity).toFixed(2);

                                return (
                                    <div key={item.listing._id} className="summary-item">
                                        <div className="item-info">
                                            <span className="item-title">{item.listing.title}</span>
                                            <span className="item-qty">
                                                x{item.quantity} {isRent && `(${item.daysRented || 1} Days)`}
                                            </span>
                                        </div>
                                        <span className="item-price">${itemTotal}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="summary-totals">
                            <div className="totals-row">
                                <span>Subtotal</span>
                                <span>${cartTotal}</span>
                            </div>
                            <div className="totals-row">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="totals-row grand-total">
                                <span>Total</span>
                                <span>${cartTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal Overlay */}
            {paymentModalOpen && checkoutData && (
                <PaymentModal
                    checkoutData={checkoutData}
                    onClose={() => setPaymentModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Checkout;
