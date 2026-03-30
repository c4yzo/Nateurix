import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewCard from '../../components/ReviewCard/ReviewCard';
import AverageRatingBadge from '../../components/AverageRatingBadge/AverageRatingBadge';
import './ListingDetail.scss';

const ListingDetail = () => {
    const [listing, setListing] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [revealContact, setRevealContact] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;

    useEffect(() => {
        const fetchListingAndReviews = async () => {
            try {
                const [listingRes, reviewsRes] = await Promise.all([
                    axios.get(`/api/listings/${id}`),
                    axios.get(`/api/reviews/${id}`)
                ]);
                setListing(listingRes.data);
                setReviews(reviewsRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchListingAndReviews();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                await axios.delete(`/api/listings/${id}`, config);
                navigate('/my-ads');
            } catch (err) {
                alert(err.response?.data?.message || err.message);
            }
        }
    };

    const handleContactSeller = () => {
        if (!userInfo) {
            alert('Please login to view seller contact information.');
            navigate('/login');
            return;
        }
        setRevealContact(true);
    };

    const handleAddToCart = async () => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const isRent = listing.transactionType === 'Rent' || listing.category === 'Tool';
            const payload = {
                listingId: id,
                quantity: 1,
                ...(isRent && { daysRented: 1 })
            };
            await axios.post('/api/cart/add', payload, config);
            navigate('/cart');
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding item to cart');
            setAddingToCart(false);
        }
    };

    if (loading) return <div className="loader container">Loading...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    return (
        <div className="listing-detail-container container">
            <Link to="/" className="btn-back">
                &larr; Back to Discover
            </Link>

            <div className="detail-card">
                <div className="detail-image-section">
                    {listing.imageUrl ? (
                        <img src={listing.imageUrl} alt={listing.title} className="detail-image" />
                    ) : (
                        <div className="placeholder-image">No Image Available</div>
                    )}
                </div>

                <div className="detail-content-section">
                    <div className="category-meta">
                        <span className="badge">
                            {listing.category === 'Plant' ? '🪴 ' : ''}
                            {listing.category === 'Seed' ? '🌱 ' : ''}
                            {listing.category === 'Tool' ? '🪏 ' : ''}
                            {listing.category === 'Fertilizer' ? '🧪 ' : ''}
                            {listing.category}
                        </span>
                        {listing.status !== 'Available' && (
                            <span className={`status-badge ${listing.status.toLowerCase()}`}>
                                {listing.status}
                            </span>
                        )}
                    </div>

                    <h1 className="title">{listing.title}</h1>

                    <div style={{ marginBottom: '5px' }}>
                        <AverageRatingBadge rating={listing.averageRating} numReviews={listing.numReviews} />
                    </div>

                    <h2 className="price">
                        ₹{listing.price?.toFixed(2)}
                        {(listing.transactionType === 'Rent' || listing.category === 'Tool') && <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: 'normal' }}> / day</span>}
                    </h2>

                    <div className="description-box">
                        <h3>Description</h3>
                        <p>{listing.description}</p>
                    </div>

                    <div className="seller-info">
                        <h3>Seller Information</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                            <div style={{ fontSize: '2rem', background: '#f0f4f8', borderRadius: '50%', width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>👤</div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#2C3E50' }}>{listing.seller?.name}</p>
                                <p className="posted-date" style={{ margin: 0, marginTop: '2px' }}>Posted on: {new Date(listing.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {userInfo && userInfo._id === listing.seller?._id ? (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                            <Link to={`/edit-listing/${listing._id}`} className="btn-primary edit-btn" style={{ flex: 1, textAlign: 'center', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                Edit Listing
                            </Link>
                            <button className="btn-secondary delete-btn" onClick={handleDelete} style={{ flex: 1, height: '50px' }}>
                                Delete
                            </button>
                        </div>
                    ) : (
                        <div className="buyer-actions" style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <button
                                className="btn-primary cart-btn"
                                onClick={handleAddToCart}
                                disabled={listing.stockCount === 0 || listing.status !== 'Available' || addingToCart}
                                style={{
                                    flex: 2,
                                    opacity: (listing.stockCount === 0 || listing.status !== 'Available') ? 0.5 : 1,
                                    cursor: (listing.stockCount === 0 || listing.status !== 'Available') ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {addingToCart ? 'Adding...' : (listing.stockCount === 0 ? 'Out of Stock' : 'Add to Cart')}
                            </button>

                            <button
                                className="btn-secondary contact-btn"
                                onClick={handleContactSeller}
                                disabled={listing.status !== 'Available'}
                                style={{
                                    flex: 1,
                                    opacity: listing.status !== 'Available' ? 0.5 : 1,
                                    cursor: listing.status !== 'Available' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Contact
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reveiws Section */}
            <div className="reviews-section" style={{ marginTop: '50px' }}>
                <h3 className="section-gradient-title" style={{ marginBottom: '20px', fontSize: '1.8rem', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
                    Customer Reviews
                </h3>

                {reviews.length === 0 ? (
                    <div className="empty-reviews glass-panel" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                        <p>There are no reviews for this item yet.</p>
                        <p>Buy this item and be the first to leave a review!</p>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map(review => (
                            <ReviewCard key={review._id} review={review} />
                        ))}
                    </div>
                )}
            </div>

            {/* Contact Modal */}
            {revealContact && (
                <div className="modal-overlay" onClick={() => setRevealContact(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h4 style={{ marginBottom: '15px', color: '#2F5233', fontSize: '1.5rem', fontWeight: 700 }}>Contact Information</h4>

                        {listing.seller?.email && (
                            <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>
                                <strong>Email:</strong> <a href={`mailto:${listing.seller.email}`} style={{ color: '#2C3E50', textDecoration: 'none' }}>{listing.seller.email}</a>
                            </p>
                        )}
                        {listing.seller?.contact && (
                            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}><strong>Phone:</strong> {listing.seller.contact}</p>
                        )}
                        {!listing.seller?.email && !listing.seller?.contact && (
                            <p style={{ color: '#7f8c8d' }}>No contact information provided by seller.</p>
                        )}

                        <button
                            className="btn-primary"
                            onClick={() => setRevealContact(false)}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: '#94C973',
                                color: '#1a202c',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListingDetail;
