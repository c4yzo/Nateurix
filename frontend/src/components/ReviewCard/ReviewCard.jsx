import React from 'react';
import './ReviewCard.scss';

const ReviewCard = ({ review }) => {
    return (
        <div className="review-card glass-panel">
            <div className="review-header">
                <div className="reviewer-info">
                    <div className="reviewer-avatar">
                        {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="reviewer-details">
                        <span className="reviewer-name">{review.user?.name || 'Anonymous User'}</span>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < review.rating ? 'filled' : 'empty'}`}>&#9733;</span>
                    ))}
                </div>
            </div>
            <div className="review-body">
                <p>{review.comment}</p>
            </div>
        </div>
    );
};

export default ReviewCard;
