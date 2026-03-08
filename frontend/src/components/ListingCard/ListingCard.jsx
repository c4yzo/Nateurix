import React from 'react';
import { Link } from 'react-router-dom';
import './ListingCard.scss';

const ListingCard = ({ listing }) => {
    return (
        <div className="listing-card">
            <Link to={`/listing/${listing._id}`} className="card-link">
                <div className="card-image-wrapper">
                    {listing.imageUrl ? (
                        <img src={listing.imageUrl} alt={listing.title} className="card-image" />
                    ) : (
                        <div className="placeholder-image">No Image</div>
                    )}

                    {listing.status !== 'Available' && (
                        <div className={`status-overlay ${listing.status.toLowerCase()}`}>
                            {listing.status}
                        </div>
                    )}
                </div>
                <div className="card-content">
                    <div className="card-header">
                        <span className="category-badge">{listing.category}</span>
                        <h3 className="listing-title">{listing.title}</h3>
                    </div>
                    <p className="listing-price">
                        ${listing.price.toFixed(2)}
                        {listing.category === 'Tool' && <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}> / day</span>}
                    </p>
                    <p className="listing-seller">
                        By: {listing.seller?.name || 'Unknown User'}
                    </p>
                </div>
            </Link>
        </div>
    );
};

export default ListingCard;
