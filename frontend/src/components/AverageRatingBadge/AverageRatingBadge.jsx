import React from 'react';

const AverageRatingBadge = ({ rating, numReviews }) => {
    // Round to 1 decimal place
    const displayRating = Number(rating).toFixed(1);

    if (numReviews === 0) {
        return <span className="no-reviews" style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>No reviews yet</span>;
    }

    return (
        <div className="average-rating-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff8e1', padding: '4px 8px', borderRadius: '12px', border: '1px solid #ffe082' }}>
            <span style={{ color: '#f39c12', fontSize: '1.1rem', lineHeight: 1 }}>&#9733;</span>
            <span style={{ fontWeight: 600, color: '#d35400', fontSize: '0.95rem' }}>{displayRating}</span>
            <span style={{ color: '#7f8c8d', fontSize: '0.85rem', marginLeft: '2px' }}>({numReviews} {numReviews === 1 ? 'review' : 'reviews'})</span>
        </div>
    );
};

export default AverageRatingBadge;
