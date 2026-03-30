import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.scss';

const Register = () => {
    const navigate = useNavigate();

    const [phase, setPhase] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        contact: ''
    });
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password, contact } = formData;

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSendOtp = async (e) => {
        e.preventDefault();

        if (contact && !/^\d{10}$/.test(contact.trim())) {
            setError('Mobile number must be strictly a 10-digit number');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const config = { headers: { 'Content-Type': 'application/json' } };
            // First send the OTP via Google SMTP
            await axios.post('/api/users/send-otp', { email }, config);

            // Advance UI and lock resend button
            setSuccessMsg('Verification code sent to your email!');
            setPhase(2);
            setCountdown(60);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const payload = { ...formData, otp };
            const config = { headers: { 'Content-Type': 'application/json' } };

            const { data } = await axios.post('/api/users/register', payload, config);

            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Verification Code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container container">
            <div className="auth-card" style={{ transition: 'all 0.3s ease' }}>
                <h2>{phase === 1 ? 'Create an Account' : 'Verify Your Email'}</h2>
                <p className="auth-subtitle">
                    {phase === 1 ? 'Join the Nateurix ecosystem today.' : `We sent a 6-digit code to ${email}`}
                </p>

                {error && <div className="error-message">{error}</div>}
                {successMsg && <div className="success-message" style={{ backgroundColor: '#e6fffa', color: '#2C7A7B', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #B2F5EA', fontSize: '0.9rem' }}>{successMsg}</div>}

                {phase === 1 ? (
                    <form onSubmit={handleSendOtp} className="auth-form">
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
                            <label htmlFor="contact">Contact Number</label>
                            <input
                                type="tel"
                                id="contact"
                                name="contact"
                                value={contact}
                                onChange={onChange}
                                required
                                pattern="[0-9]{10}"
                                title="Mobile number must be exactly 10 digits"
                                placeholder="1234567890"
                            />
                        </div>

                        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                            {loading ? 'Sending Code...' : 'Continue to Verification'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form verification-phase">
                        <div className="form-group" style={{ textAlign: 'center' }}>
                            <label htmlFor="otp" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '15px' }}>Enter 6-Digit Code</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="------"
                                maxLength="6"
                                style={{
                                    fontSize: '2rem',
                                    letterSpacing: '10px',
                                    textAlign: 'center',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    border: '2px solid #94C973',
                                    backgroundColor: '#f7fafc',
                                    width: '100%',
                                    outline: 'none',
                                    boxShadow: '0 4px 12px rgba(148, 201, 115, 0.1)'
                                }}
                            />
                        </div>

                        <button type="submit" className="btn-primary auth-submit" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={countdown > 0 || loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: countdown > 0 ? '#a0aec0' : '#2F5233',
                                    textDecoration: countdown > 0 ? 'none' : 'underline',
                                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem'
                                }}
                            >
                                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Verification Code'}
                            </button>
                            <br />
                            <button
                                type="button"
                                onClick={() => { setPhase(1); setError(''); setSuccessMsg(''); setOtp(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#718096',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginTop: '15px'
                                }}
                            >
                                ← Back to Email Details
                            </button>
                        </div>
                    </form>
                )}

                {phase === 1 && (
                    <div className="auth-redirect">
                        Already have an account? <Link to="/login">Login here</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
