import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.scss';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        contact: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password, contact } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const { data } = await axios.post('/api/users/register', formData, config);

            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
            // In a real app we might reload or use Context API to update Navbar
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container container">
            <div className="auth-card">
                <h2>Create an Account</h2>
                <p className="auth-subtitle">Join the Nateurix ecosystem today.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={onSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" name="name" value={name} onChange={onChange} required placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" value={email} onChange={onChange} required placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" value={password} onChange={onChange} required placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contact">Contact Number (Optional)</label>
                        <input type="text" id="contact" name="contact" value={contact} onChange={onChange} placeholder="+1 234 567 8900" />
                    </div>

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="auth-redirect">
                    Already have an account? <Link to="/login">Login here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
