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

                    <span className="glass-category-badge">{listing.category}</span>

                    {listing.status !== 'Available' && (
                        <div className={`status-overlay ${listing.status.toLowerCase()}`}>
                            {listing.status}
                        </div>
                    )}
                </div>

                <div className="card-content">
                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-seller">By {listing.seller?.name?.split(' ')[0] || 'Unknown'}</p>

                    <div className="card-footer">
                        <p className="listing-price">
                            ₹{listing.price.toFixed(2)}
                            {listing.category === 'Tool' && <span className="price-suffix"> / day</span>}
                        </p>

                        <div className="action-circle">
                            <span className="arrow-icon">→</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ListingCard;
