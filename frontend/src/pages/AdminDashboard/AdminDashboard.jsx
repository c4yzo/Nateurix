import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.scss';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const adminInfoString = localStorage.getItem('adminInfo');
    const adminInfo = adminInfoString ? JSON.parse(adminInfoString) : null;

    useEffect(() => {
        if (!adminInfo) {
            navigate('/admin/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${adminInfo.token}`,
                    },
                };
                const { data } = await axios.get('/api/admin/orders', config);
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchOrders();
    }, [navigate, adminInfo]);

    const handleDeliveryUpdate = async (orderId, itemId, newStatus) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo.token}`,
                },
            };

            await axios.put(`/api/admin/orders/${orderId}/item/${itemId}/status`, { deliveryStatus: newStatus }, config);

            // Update local state to reflect change
            setOrders(orders.map(order => {
                if (order._id === orderId) {
                    return {
                        ...order,
                        orderItems: order.orderItems.map(item =>
                            item._id === itemId ? { ...item, deliveryStatus: newStatus } : item
                        )
                    };
                }
                return order;
            }));

        } catch (err) {
            alert(err.response?.data?.message || 'Error updating status');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
    };

    if (loading) return <div className="loader container">Loading Admin Dashboard...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    return (
        <div className="admin-dashboard-container container">
            <div className="dashboard-header">
                <h2>Admin Control Panel</h2>
                <button onClick={handleLogout} className="btn-logout">Logout Staff</button>
            </div>

            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <p>No orders have been placed yet.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order._id} className="aesthetics-order-card">
                            <div className="order-meta-header">
                                <span className="order-id-badge">ORDER #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                                <span className="order-date-text">{new Date(order.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>

                            <div className="order-items-grid">
                                {order.orderItems.map(item => (
                                    <div key={item._id} className="aesthetics-item-card">
                                        <div className="item-header-glass">
                                            <div className="item-product">
                                                {item.listing?.imageUrl ? (
                                                    <img src={item.listing.imageUrl} alt={item.listing?.title} />
                                                ) : (
                                                    <div className="no-img">No Img</div>
                                                )}
                                                <div>
                                                    <h4 className="item-listing-title">
                                                        {item.listing?.title || 'Deleted Item'}
                                                        <span className="qty-badge">x{item.quantity}</span>
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="item-status">
                                                <select
                                                    className={`asthetic-select ${item.deliveryStatus?.toLowerCase() || 'processing'}`}
                                                    value={item.deliveryStatus || 'Processing'}
                                                    onChange={(e) => handleDeliveryUpdate(order._id, item._id, e.target.value)}
                                                    disabled={item.deliveryStatus === 'Delivered'}
                                                >
                                                    {(!item.deliveryStatus || item.deliveryStatus === 'Processing') && <option value="Processing">Processing</option>}
                                                    {(!item.deliveryStatus || item.deliveryStatus === 'Processing' || item.deliveryStatus === 'Shipped') && <option value="Shipped">Shipped</option>}
                                                    <option value="Delivered">Delivered</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="logistics-timeline">
                                            <div className="timeline-node seller-node">
                                                <div className="node-icon">🏪</div>
                                                <div className="node-content">
                                                    <h5>Pickup From: {item.listing?.seller?.name || 'Unknown User'}</h5>
                                                    <p>{item.listing?.seller?.email} {item.listing?.seller?.contact ? `| ${item.listing?.seller?.contact}` : ''}</p>

                                                    {item.pickupAddress === 'LEGACY_ITEM_NO_ADDRESS' ? (
                                                        <span className="pill pill-warning">⚠️ Action Required: Legacy Item</span>
                                                    ) : (
                                                        <p className="address-text">{item.pickupAddress}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="timeline-connector">
                                                <div className="line"></div>
                                                <div className="transit-icon">🚚</div>
                                            </div>

                                            <div className="timeline-node buyer-node">
                                                <div className="node-icon">🏡</div>
                                                <div className="node-content">
                                                    <h5>Deliver To: {order.user?.name || 'Unknown Buyer'}</h5>
                                                    <p>{order.user?.email}</p>
                                                    <p className="address-text">
                                                        {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
