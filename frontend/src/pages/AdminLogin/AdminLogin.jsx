import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.scss';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const adminInfo = localStorage.getItem('adminInfo');
        if (adminInfo) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await axios.post(
                '/api/admin/login',
                { email, password },
                config
            );

            localStorage.setItem('adminInfo', JSON.stringify(data));
            navigate('/admin/dashboard');
        } catch (error) {
            setError(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <h2>Staff Portal</h2>
                <p className="subtitle">Secure access for Nateurix administrators.</p>
                {error && <div className="error-message" style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none' }}>{error}</div>}
                <form onSubmit={submitHandler}>
                    <div className="form-group">
                        <label htmlFor="email">Admin Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter staff email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-admin" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
