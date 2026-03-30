import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../CreateListing/CreateListing.scss'; // Reuse styles

const EditListing = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Plant',
        price: '',
        stockCount: 1,
        imageUrl: '',
        pickupAddress: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = useMemo(() => {
        return userInfoString ? JSON.parse(userInfoString) : null;
    }, [userInfoString]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchListing = async () => {
            try {
                const { data } = await axios.get(`/api/listings/${id}`);

                // Security check - just visual on client, real check is on server
                if (data.seller?._id !== userInfo._id) {
                    navigate('/');
                }

                setFormData({
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    price: data.price,
                    stockCount: data.stockCount || 1,
                    imageUrl: data.imageUrl || '',
                    pickupAddress: data.pickupAddress || '',
                });
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchListing();
    }, [id, navigate, userInfo]);

    const { title, description, category, price, stockCount, imageUrl, pickupAddress } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const uploadData = new FormData();
        uploadData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            const { data } = await axios.post('/api/upload', uploadData, config);

            setFormData({ ...formData, imageUrl: data });
            setUploading(false);
        } catch (err) {
            console.error(err);
            setUploading(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.put(`/api/listings/${id}`, {
                ...formData,
                stockCount: parseInt(formData.stockCount, 10)
            }, config);
            navigate('/my-ads');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loader container">Loading...</div>;

    return (
        <div className="create-listing-container container">
            <div className="create-listing-card">
                <h2>Edit Listing</h2>
                <p className="subtitle">Update the details of your ad.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={onSubmit} className="listing-form">
                    <div className="form-group">
                        <label htmlFor="title">Title <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>(Cannot be edited)</span></label>
                        <input type="text" id="title" name="title" value={title} onChange={onChange} required disabled style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#666' }} />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="category">Category <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>(Cannot be edited)</span></label>
                            <select id="category" name="category" value={category} onChange={onChange} disabled style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}>
                                <option value="Plant">Plant</option>
                                <option value="Seed">Seed</option>
                                <option value="Tool">Tool</option>
                                <option value="Fertilizer">Fertilizer</option>
                            </select>
                        </div>
                        <div className="form-group half">
                            <label htmlFor="price">{category === 'Tool' ? 'Price per day (₹)' : 'Price (₹)'}</label>
                            <input type="number" id="price" name="price" value={price} onChange={onChange} required min="0" step="0.01" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="stockCount">Quantity in Stock</label>
                        <input type="number" id="stockCount" name="stockCount" value={stockCount} onChange={onChange} required min="0" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="image-upload">Update Image</label>
                        <input type="file" id="image-upload" onChange={uploadFileHandler} accept="image/*" />
                        {uploading && <small>Uploading...</small>}
                        {imageUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <img src={imageUrl} alt="Preview" style={{ maxWidth: '100px', borderRadius: '4px' }} />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" value={description} onChange={onChange} required rows="4"></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pickupAddress">Pickup Address</label>
                        <textarea id="pickupAddress" name="pickupAddress" value={pickupAddress} onChange={onChange} required rows="3"></textarea>
                    </div>

                    <button type="submit" className="btn-primary submit-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Update Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditListing;
