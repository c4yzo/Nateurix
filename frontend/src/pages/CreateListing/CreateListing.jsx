import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateListing.scss';

const CreateListing = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Plant', // Default
        price: '',
        stockCount: 1,
        imageUrl: '',
        pickupAddress: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Check auth
    const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
    if (!userInfo) {
        navigate('/login');
    }

    const { title, description, category, price, stockCount, imageUrl, pickupAddress } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                }
            };

            const { data } = await axios.post('/api/listings', {
                ...formData,
                stockCount: parseInt(formData.stockCount, 10)
            }, config);
            navigate(`/listing/${data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="create-listing-container container">
            <div className="create-listing-card">
                <h2>Post a New Ad</h2>
                <p className="subtitle">Share your plants or tools with the Nateurix community.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={onSubmit} className="listing-form">
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input type="text" id="title" name="title" value={title} onChange={onChange} required placeholder="e.g., Monstera Deliciosa (Medium)" />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="category">Category</label>
                            <select id="category" name="category" value={category} onChange={onChange}>
                                <option value="Plant">Plant</option>
                                <option value="Seed">Seed</option>
                                <option value="Tool">Tool</option>
                                <option value="Fertilizer">Fertilizer</option>
                            </select>
                        </div>
                        <div className="form-group half">
                            <label htmlFor="price">{category === 'Tool' ? 'Price per day ($)' : 'Price ($)'}</label>
                            <input type="number" id="price" name="price" value={price} onChange={onChange} required min="0" step="0.01" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="stockCount">Quantity in Stock</label>
                        <input type="number" id="stockCount" name="stockCount" value={stockCount} onChange={onChange} required min="1" placeholder="1" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="image-upload">Upload Image</label>
                        <input type="file" id="image-upload" onChange={uploadFileHandler} accept="image/*" />
                        {uploading && <small>Uploading...</small>}
                        {imageUrl && <small>Image uploaded: {imageUrl}</small>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" value={description} onChange={onChange} required rows="4" placeholder="Describe the item, its condition, care needs, etc."></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pickupAddress">Pickup Address</label>
                        <textarea id="pickupAddress" name="pickupAddress" value={pickupAddress} onChange={onChange} required rows="3" placeholder="Enter the address where the buyer can pick up this item."></textarea>
                    </div>

                    <button type="submit" className="btn-primary submit-btn" disabled={loading}>
                        {loading ? 'Posting...' : 'Publish Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;
