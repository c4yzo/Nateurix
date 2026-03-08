import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarRatingInput from '../../components/StarRatingInput/StarRatingInput';
import './PurchaseHistory.scss';

const PurchaseHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Review Modal States
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewListingId, setReviewListingId] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchPurchases = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.get('/api/orders/purchases', config);
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchPurchases();
    }, [navigate, userInfo]);

    if (loading) return <div className="loader container">Loading your purchases...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    const openReviewModal = (listingId) => {
        setReviewListingId(listingId);
        setRating(0);
        setComment('');
        setReviewError('');
        setIsReviewModalOpen(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setReviewError('Please select a star rating.');
            return;
        }
        try {
            setReviewLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.post(`/api/reviews/${reviewListingId}`, { rating, comment }, config);

            setReviewLoading(false);
            setIsReviewModalOpen(false);
            alert('Your review has been successfully submitted!');
        } catch (err) {
            setReviewError(err.response?.data?.message || err.message);
            setReviewLoading(false);
        }
    };

    return (
        <div className="purchase-history-container container">
            <div className="history-header">
                <h2>Purchase History</h2>
                <p>Track your orders, reorder items, or manage returns.</p>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <h3>No purchases yet</h3>
                    <p>Discover plants, seeds, and tools today!</p>
                    <button onClick={() => navigate('/')} className="btn-primary">Browse Shop</button>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order._id} className="order-card glass-panel">
                            <div className="order-header">
                                <div className="order-meta">
                                    <span className="order-id">Order ID: #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                                    <span className="order-date">Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="order-total">
                                    Total: <strong>${order.totalPrice.toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="order-items">
                                {order.orderItems.map(item => {
                                    if (!item.listing) return null;
                                    return (
                                        <div key={item._id} className="history-item">
                                            <div className="item-image">
                                                {item.listing.imageUrl ? (
                                                    <img src={item.listing.imageUrl} alt={item.listing.title} />
                                                ) : (
                                                    <div className="img-placeholder">UI</div>
                                                )}
                                            </div>
                                            <div className="item-details">
                                                <h4>{item.listing.title}</h4>
                                                <p>Qty: {item.quantity}</p>
                                                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                                <div className="item-status" style={{ marginTop: '8px' }}>
                                                    <span className={`badge ${item.deliveryStatus ? item.deliveryStatus.toLowerCase() : 'processing'}`} style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        backgroundColor: item.deliveryStatus === 'Delivered' ? '#d4edda' : item.deliveryStatus === 'Shipped' ? '#cce5ff' : '#fff3cd',
                                                        color: item.deliveryStatus === 'Delivered' ? '#155724' : item.deliveryStatus === 'Shipped' ? '#004085' : '#856404'
                                                    }}>
                                                        📦 {item.deliveryStatus || 'Processing'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                <button
                                                    onClick={() => navigate(`/listing/${item.listing._id}`)}
                                                    className="btn-outline"
                                                >
                                                    View Item
                                                </button>
                                                {item.deliveryStatus === 'Delivered' && (
                                                    <button
                                                        onClick={() => openReviewModal(item.listing._id)}
                                                        className="btn-primary"
                                                    >
                                                        Leave a Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {isReviewModalOpen && (
                <div className="review-modal-overlay">
                    <div className="review-modal-content glass-panel">
                        <button className="close-btn" onClick={() => setIsReviewModalOpen(false)}>&times;</button>
                        <h3>Leave a Review</h3>
                        {reviewError && <div className="error-message" style={{ marginBottom: '10px' }}>{reviewError}</div>}
                        <form onSubmit={submitReview}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Rating</label>
                                <StarRatingInput rating={rating} setRating={setRating} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows="4"
                                    required
                                    placeholder="What did you think of this item?"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={reviewLoading}>
                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseHistory;
