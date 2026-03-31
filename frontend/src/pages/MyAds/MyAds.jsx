import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../../components/ListingCard/ListingCard';
import './MyAds.scss';

const MyAds = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'sales'

    // States for Listings Tab
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [listingsError, setListingsError] = useState('');

    // States for Sales Tab
    const [sales, setSales] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [salesError, setSalesError] = useState('');
    const [profitMetrics, setProfitMetrics] = useState({ totalProfit: 0, salesProfit: 0, rentalsProfit: 0 });
    const [profitFetched, setProfitFetched] = useState(false);

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchMyListings = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('/api/listings/my-listings', config);
                setListings(data);
                setLoadingListings(false);
            } catch (err) {
                setListingsError(err.response?.data?.message || err.message);
                setLoadingListings(false);
            }
        };

        const fetchMySales = async () => {
            setLoadingSales(true);
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('/api/orders/sales', config);
                setSales(data);
                setLoadingSales(false);
            } catch (err) {
                setSalesError(err.response?.data?.message || err.message);
                setLoadingSales(false);
            }
        };

        const fetchProfit = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get('/api/orders/profit', config);
                setProfitMetrics(data);
                setProfitFetched(true);
            } catch (err) {
                console.error('Error fetching profit:', err);
            }
        };

        if (activeTab === 'listings' && listings.length === 0) {
            fetchMyListings();
        } else if (activeTab === 'sales') {
            if (sales.length === 0) fetchMySales();
            if (!profitFetched) fetchProfit();
        }
    }, [navigate, userInfo, activeTab, listings.length, sales.length, profitFetched]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.patch(`/api/listings/${id}/status`, { status: newStatus }, config);
            setListings(listings.map(listing =>
                listing._id === id ? { ...listing, status: newStatus } : listing
            ));
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };


    const renderListingsTab = () => {
        if (loadingListings) return <div className="loader">Loading your listings...</div>;
        if (listingsError) return <div className="error-message">{listingsError}</div>;
        if (listings.length === 0) return (
            <div className="empty-state">
                <h3>You haven't posted any listings yet.</h3>
                <p>Start selling your plants, seeds, or tools today!</p>
            </div>
        );

        return (
            <div className="listings-grid">
                {listings.map((listing) => (
                    <div key={listing._id} className="my-ads-card-wrapper">
                        <ListingCard listing={listing} />
                        <div className="status-controls">
                            <span className="current-status">Status: <strong>{listing.status}</strong></span>
                            <div className="status-buttons">
                                {listing.status !== 'Available' && (
                                    <button onClick={() => handleStatusUpdate(listing._id, 'Available')} className="btn-sm btn-outline">Make Available</button>
                                )}
                                {listing.status !== 'Sold' && listing.category !== 'Tool' && (
                                    <button onClick={() => handleStatusUpdate(listing._id, 'Sold')} className="btn-sm btn-danger">Mark Sold</button>
                                )}
                                {listing.status !== 'Rented' && listing.category === 'Tool' && (
                                    <button onClick={() => handleStatusUpdate(listing._id, 'Rented')} className="btn-sm btn-warning">Mark Rented</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderSalesTab = () => {
        if (loadingSales) return <div className="loader">Loading your Sales Dashboard...</div>;
        if (salesError) return <div className="error-message">{salesError}</div>;

        return (
            <div className="sales-dashboard-wrapper">
                {/* 1. Revenue Analytics Widget */}
                <div className="profit-analytics-widget">
                    <div className="profit-icon">💎</div>
                    <div className="profit-details">
                        <h4>Total Lifetime Revenue</h4>
                        <h2 className="gradient-text">₹{profitMetrics.totalProfit.toFixed(2)}</h2>
                        <div className="profit-breakdown">
                            <span className="sales-pill">📦 Sales: ₹{profitMetrics.salesProfit.toFixed(2)}</span>
                            <span className="rentals-pill">🔄 Rentals: ₹{profitMetrics.rentalsProfit.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Responsive Sales Grid */}
                {sales.length === 0 ? (
                    <div className="empty-state">
                        <h3>No sales yet.</h3>
                        <p>When someone buys your items, their orders will populate right here.</p>
                    </div>
                ) : (
                    <div className="sales-grid">
                        {sales.map(order => {
                            const myItems = order.orderItems.filter(item =>
                                item.listing && item.listing.seller === userInfo._id
                            );

                            return (
                                <div key={order._id} className="sales-card stylish-card">
                                    <div className="sales-header">
                                        <div className="order-info">
                                            <h4>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</h4>
                                            <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="sales-body">
                                        <div className="buyer-info">
                                            <h5>Ship To:</h5>
                                            <p className="buyer-name"><strong>{order.user.name}</strong> ({order.user.email})</p>
                                            <p className="address-text">{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                                        </div>

                                        <div className="items-sold">
                                            <h5>Items Ordered:</h5>
                                            <div className="sub-items-grid">
                                                {myItems.map(item => (
                                                    <div key={item._id} className="sold-item-card">
                                                        <div className="sold-item-meta">
                                                            <span><strong>{item.quantity}x</strong> {item.listing.title}</span>
                                                            <span className="sales-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                        <div className="status-badge-container">
                                                            <span className={`status-badge ${item.deliveryStatus?.replace(/\s+/g, '-').toLowerCase() || 'processing'}`}>
                                                                {item.deliveryStatus || 'Processing'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="my-ads-container container">
            <div className="my-ads-header">
                <h2>Seller Dashboard</h2>
                <Link to="/create-listing" className="btn-primary">Post New Ad</Link>
            </div>

            <div className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('listings')}
                >
                    My Listings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Sales Dashboard
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'listings' ? renderListingsTab() : renderSalesTab()}
            </div>
        </div>
    );
};

export default MyAds;
