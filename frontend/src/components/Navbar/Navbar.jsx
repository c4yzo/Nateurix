import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.scss';

const Navbar = () => {
    const navigate = useNavigate();
    // We'll replace this with real auth state logic soon
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = React.useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        if (userInfo) {
            const fetchCartCount = async () => {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${userInfo.token}`,
                        },
                    };
                    const { data } = await axios.get('/api/cart', config);
                    // Calculate total items (sum of quantities)
                    const totalItems = data.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                    setCartCount(totalItems);
                } catch (error) {
                    console.error('Error fetching cart count:', error);
                }
            };
            fetchCartCount();
        }
    }, [userInfo]);

    const logoutHandler = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <header className="navbar-header">
            <nav className="navbar container">
                <div className="navbar-brand">
                    <Link to="/">
                        <span className="brand-highlight">Nateur</span>ix
                    </Link>
                </div>

                <ul className="navbar-nav">
                    <li className="nav-item">
                        <Link to="/" className="nav-link">Home</Link>
                    </li>

                    {userInfo ? (
                        <>
                            <li className="nav-item">
                                <Link to="/create-listing" className="btn-register" style={{ backgroundColor: '#94C973', color: '#2C3E50', marginRight: '10px' }}>Post Ad</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/my-ads" className="nav-link" style={{ fontWeight: 600, color: '#2F5233', marginRight: '10px' }}>My Ads</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/purchases" className="nav-link" style={{ fontWeight: 600, color: '#2F5233', marginRight: '10px' }}>Purchases</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/cart" className="nav-link cart-link" style={{ fontWeight: 600, color: '#2C3E50', marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                                    🛒 Cart
                                    {cartCount > 0 && <span className="cart-badge" style={{ backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', padding: '2px 8px', marginLeft: '5px', fontSize: '0.8rem' }}>{cartCount}</span>}
                                </Link>
                            </li>
                            <li className="nav-item user-greeting">
                                Hi, {userInfo.name}
                            </li>
                            <li className="nav-item">
                                <button className="btn-logout" onClick={logoutHandler}>Logout</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item">
                                <Link to="/login" className="nav-link">Login</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/register" className="btn-register">Register</Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
