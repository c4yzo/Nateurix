import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.scss';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'rentals'
    const [activeSalesTab, setActiveSalesTab] = useState('pending'); // 'pending', 'shipped', 'delivered'
    const [activeRentalsTab, setActiveRentalsTab] = useState('outbound'); // 'outbound', 'active', 'returning', 'completed'
    const navigate = useNavigate();

    const adminInfoString = localStorage.getItem('adminInfo');
    const adminInfo = adminInfoString ? JSON.parse(adminInfoString) : null;

    useEffect(() => {
        if (!adminInfo) {
            navigate('/admin/login');
            return;
        }

        const fetchAllData = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${adminInfo.token}` },
                };
                const [ordersRes, rentalsRes] = await Promise.all([
                    axios.get('/api/admin/orders', config),
                    axios.get('/api/admin/rentals', config)
                ]);

                setOrders(ordersRes.data);
                setRentals(rentalsRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchAllData();
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

            // Local state update
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

    const handleRentalStatusUpdate = async (rentalId, newStatus) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo.token}`,
                },
            };
            await axios.put(`/api/admin/rentals/${rentalId}/status`, { rentalStatus: newStatus }, config);

            // Local state update
            setRentals(rentals.map(rental =>
                rental._id === rentalId ? { ...rental, rentalStatus: newStatus } : rental
            ));
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating rental status');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
    };

    if (loading) return <div className="loader container">Loading Control Panel...</div>;
    if (error) return <div className="error-message container">{error}</div>;

    // --- SALES KANBAN LOGIC ---
    const allSaleItems = [];
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            allSaleItems.push({ order, item });
        });
    });

    const pendingSales = allSaleItems.filter(x => !x.item.deliveryStatus || x.item.deliveryStatus === 'Processing');
    const shippedSales = allSaleItems.filter(x => x.item.deliveryStatus === 'Shipped');
    const deliveredSales = allSaleItems.filter(x => x.item.deliveryStatus === 'Delivered');

    const renderSaleCard = ({ order, item }) => (
        <div key={item._id} className="kanban-card">
            <div className="card-header">
                <span className="order-id">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                {item.pickupAddress === 'LEGACY_ITEM_NO_ADDRESS' && <span className="warning-badge">⚠️ Legacy</span>}
            </div>
            <div className="card-body">
                <div className="item-info">
                    {item.listing?.imageUrl ? <img src={item.listing.imageUrl} alt="item" /> : <div className="no-img">Img</div>}
                    <div>
                        <strong>{item.listing?.title || 'Deleted Item'}</strong>
                        <p>Qty: {item.quantity}</p>
                    </div>
                </div>
                <div className="logistics-info">
                    <p><strong>From:</strong> {item.listing?.seller?.name || 'Unknown'}</p>
                    <p className="address-text">{item.pickupAddress === 'LEGACY_ITEM_NO_ADDRESS' ? 'Contact Seller' : item.pickupAddress}</p>
                    <p className="arrow">⬇️</p>
                    <p><strong>To:</strong> {order.user?.name || 'Unknown'}</p>
                    <p className="address-text">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                </div>
            </div>
            <div className="card-actions">
                <select
                    className={`status-select ${item.deliveryStatus?.toLowerCase() || 'processing'}`}
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
    );

    // --- RENTALS LOGIC ---
    const outboundRentals = rentals.filter(r => ['Pending', 'Delivering to Buyer'].includes(r.rentalStatus));
    const activeRentals = rentals.filter(r => r.rentalStatus === 'Active');
    const returnRentals = rentals.filter(r => ['Collecting from Buyer', 'Returning to Seller'].includes(r.rentalStatus));
    const completedRentals = rentals.filter(r => r.rentalStatus === 'Completed');

    const renderRentalCard = (rental) => (
        <div key={rental._id} className="kanban-card rental-card">
            <div className="card-header">
                <span className="order-id">#{rental._id.substring(rental._id.length - 6).toUpperCase()}</span>
                <span className="rental-status-badge">{rental.rentalStatus}</span>
            </div>
            <div className="card-body">
                <div className="rented-items-list">
                    {rental.rentedItems.map(item => (
                        <div key={item._id} className="item-info">
                            {item.listing?.imageUrl ? <img src={item.listing.imageUrl} alt="item" /> : <div className="no-img">Img</div>}
                            <div>
                                <strong>{item.listing?.title || 'Deleted Tool'}</strong>
                                <p>Qty: {item.quantity} | <strong style={{ color: '#e74c3c' }}>{item.daysRented} Days</strong></p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="logistics-info">
                    <p><strong>Seller:</strong> {rental.seller?.name}</p>
                    <p className="address-text">{rental.rentedItems[0]?.pickupAddress}</p>
                    <p className="arrow">↕️</p>
                    <p><strong>Buyer:</strong> {rental.buyer?.name}</p>
                    <p className="address-text">{rental.shippingAddress.address}, {rental.shippingAddress.city}</p>
                </div>
            </div>
            <div className="card-actions">
                <select
                    className={`status-select rental-select`}
                    value={rental.rentalStatus}
                    onChange={(e) => handleRentalStatusUpdate(rental._id, e.target.value)}
                    disabled={rental.rentalStatus === 'Completed'}
                >
                    {['Pending', 'Delivering to Buyer', 'Active', 'Collecting from Buyer', 'Returning to Seller', 'Completed'].map((status, index, arr) => (
                        <option
                            key={status}
                            value={status}
                            disabled={index < arr.indexOf(rental.rentalStatus)}
                        >
                            {status}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard-container container">
            <div className="dashboard-header">
                <h2>Admin Control Center</h2>
                <div className="tab-controls">
                    <button
                        className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        📦 Sales Management
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rentals')}
                    >
                        🔄 Rentals Management
                    </button>
                </div>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>

            {activeTab === 'sales' && (
                <div className="tab-content-area">
                    <div className="sub-tab-controls">
                        <button className={`sub-tab-btn pending ${activeSalesTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveSalesTab('pending')}>
                            Pending Pickup ({pendingSales.length})
                        </button>
                        <button className={`sub-tab-btn shipped ${activeSalesTab === 'shipped' ? 'active' : ''}`} onClick={() => setActiveSalesTab('shipped')}>
                            In Transit ({shippedSales.length})
                        </button>
                        <button className={`sub-tab-btn delivered ${activeSalesTab === 'delivered' ? 'active' : ''}`} onClick={() => setActiveSalesTab('delivered')}>
                            Delivered ({deliveredSales.length})
                        </button>
                    </div>

                    <div className="cards-grid">
                        {activeSalesTab === 'pending' && pendingSales.map(renderSaleCard)}
                        {activeSalesTab === 'shipped' && shippedSales.map(renderSaleCard)}
                        {activeSalesTab === 'delivered' && deliveredSales.map(renderSaleCard)}

                        {/* Empty States */}
                        {activeSalesTab === 'pending' && pendingSales.length === 0 && <div className="empty-state">No items awaiting pickup.</div>}
                        {activeSalesTab === 'shipped' && shippedSales.length === 0 && <div className="empty-state">No items currently in transit.</div>}
                        {activeSalesTab === 'delivered' && deliveredSales.length === 0 && <div className="empty-state">No items have been delivered yet.</div>}
                    </div>
                </div>
            )}

            {activeTab === 'rentals' && (
                <div className="tab-content-area">
                    <div className="sub-tab-controls">
                        <button className={`sub-tab-btn outbound ${activeRentalsTab === 'outbound' ? 'active' : ''}`} onClick={() => setActiveRentalsTab('outbound')}>
                            Outbound to Buyer ({outboundRentals.length})
                        </button>
                        <button className={`sub-tab-btn active-status ${activeRentalsTab === 'active' ? 'active' : ''}`} onClick={() => setActiveRentalsTab('active')}>
                            Active in Use ({activeRentals.length})
                        </button>
                        <button className={`sub-tab-btn returning ${activeRentalsTab === 'returning' ? 'active' : ''}`} onClick={() => setActiveRentalsTab('returning')}>
                            Returning to Seller ({returnRentals.length})
                        </button>
                        <button className={`sub-tab-btn completed ${activeRentalsTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveRentalsTab('completed')}>
                            Completed Rentals ({completedRentals.length})
                        </button>
                    </div>

                    <div className="cards-grid">
                        {activeRentalsTab === 'outbound' && outboundRentals.map(renderRentalCard)}
                        {activeRentalsTab === 'active' && activeRentals.map(renderRentalCard)}
                        {activeRentalsTab === 'returning' && returnRentals.map(renderRentalCard)}
                        {activeRentalsTab === 'completed' && completedRentals.map(renderRentalCard)}

                        {/* Empty States */}
                        {activeRentalsTab === 'outbound' && outboundRentals.length === 0 && <div className="empty-state">No rentals pending outbound delivery.</div>}
                        {activeRentalsTab === 'active' && activeRentals.length === 0 && <div className="empty-state">No rentals currently active in use.</div>}
                        {activeRentalsTab === 'returning' && returnRentals.length === 0 && <div className="empty-state">No rentals currently returning to seller.</div>}
                        {activeRentalsTab === 'completed' && completedRentals.length === 0 && <div className="empty-state">No completed rental histories available.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
