import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.scss';
import logo from '../../assets/images/logo.png';

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
                        <img src={logo} alt="Nateurix Logo" className="brand-logo" />
                        <span className="brand-text">Nateurix</span>
                    </Link>
                </div>

                <ul className="navbar-nav">
                    <li className="nav-item">
                        <Link to="/" className="nav-link">Home</Link>
                    </li>

                    {userInfo ? (
                        <>
                            <li className="nav-item">
                                <Link to="/create-listing" className="btn-register header-btn shine-effect">
                                    <span className="icon">🌱</span> Sell an Item
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/my-ads" className="nav-link">
                                    <span className="icon">🌿</span> My Shop
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/identify" className="nav-link ai-link">
                                    <span className="icon">🤖</span> AI Identifier
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/purchases" className="nav-link">
                                    <span className="icon">📦</span> Purchases
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/cart" className="nav-link cart-link">
                                    <span className="icon">🛒</span> Cart
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>
                            </li>
                            <li className="nav-item user-dropdown">
                                <div className="user-greeting">
                                    Hey, {userInfo.name.split(' ')[0]}
                                </div>
                                <div className="dropdown-menu">
                                    <button className="btn-logout" onClick={logoutHandler}>Logout</button>
                                </div>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item">
                                <Link to="/login" className="nav-link">Login</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/register" className="btn-register header-btn shine-effect">Sign Up</Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
