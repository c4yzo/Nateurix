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

    // --- RENTALS KANBAN LOGIC ---
    const outboundRentals = rentals.filter(r => ['Pending', 'Delivering to Buyer'].includes(r.rentalStatus));
    const activeRentals = rentals.filter(r => r.rentalStatus === 'Active');
    const returnRentals = rentals.filter(r => ['Collecting from Buyer', 'Returning to Seller', 'Completed'].includes(r.rentalStatus));

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
                <div className="kanban-board">
                    <div className="kanban-column">
                        <div className="column-header processing">
                            <h3>Pending Pickup ({pendingSales.length})</h3>
                        </div>
                        <div className="column-content">
                            {pendingSales.map(renderSaleCard)}
                        </div>
                    </div>
                    <div className="kanban-column">
                        <div className="column-header shipped">
                            <h3>In Transit ({shippedSales.length})</h3>
                        </div>
                        <div className="column-content">
                            {shippedSales.map(renderSaleCard)}
                        </div>
                    </div>
                    <div className="kanban-column">
                        <div className="column-header delivered">
                            <h3>Delivered ({deliveredSales.length})</h3>
                        </div>
                        <div className="column-content">
                            {deliveredSales.map(renderSaleCard)}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rentals' && (
                <div className="kanban-board">
                    <div className="kanban-column">
                        <div className="column-header processing">
                            <h3>Outbound to Buyer ({outboundRentals.length})</h3>
                        </div>
                        <div className="column-content">
                            {outboundRentals.map(renderRentalCard)}
                        </div>
                    </div>
                    <div className="kanban-column">
                        <div className="column-header active-rental">
                            <h3>Active in Use ({activeRentals.length})</h3>
                        </div>
                        <div className="column-content">
                            {activeRentals.map(renderRentalCard)}
                        </div>
                    </div>
                    <div className="kanban-column">
                        <div className="column-header returning">
                            <h3>Returning to Seller ({returnRentals.length})</h3>
                        </div>
                        <div className="column-content">
                            {returnRentals.map(renderRentalCard)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
