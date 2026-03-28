import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './PlantIdentifier.scss';

const PlantIdentifier = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setResult(null); // Clear previous results
            setError('');
        } else {
            setError('Please select a valid image file');
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post('/api/ml/identify-plant', formData, config);
            setResult(data);
        } catch (err) {
            console.error('Error analyzing plant:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to analyze plant. Please ensure the AI microservice is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="plant-identifier-container">
            <div className="identifier-card glass-panel">
                <h2>AI Plant Scanner 🌿</h2>
                <p className="subtitle">Upload a photo of a leaf, and our advanced microservice will identify and research it for you.</p>

                <div className="upload-section">
                    <input
                        type="file"
                        id="plant-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                    />
                    <label htmlFor="plant-image" className="upload-label">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="image-preview" />
                        ) : (
                            <div className="upload-placeholder">
                                <span className="icon">📸</span>
                                <span>Click to Upload Image</span>
                            </div>
                        )}
                    </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                    className="btn-primary analyze-btn"
                    onClick={handleAnalyze}
                    disabled={!selectedImage || loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            AI is analyzing and researching the plant...
                        </>
                    ) : (
                        'Analyze Plant'
                    )}
                </button>

                {result && (
                    <div className="results-section">
                        <h3>Analysis Complete</h3>
                        <div className="result-header">
                            <span className="plant-name">{result.plant}</span>
                            <span className="confidence-badge">Confidence: {result.confidence}</span>
                        </div>
                        <div className="care-instructions">
                            <ReactMarkdown>{result.details}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlantIdentifier;
