import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../../components/ListingCard/ListingCard';
import SearchBar from '../../components/SearchBar/SearchBar';
import CategoryFilters from '../../components/CategoryFilters/CategoryFilters';
import './Home.scss';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search capabilities
    const [searchKeyword, setSearchKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `/api/listings?search=${submittedKeyword}&category=${activeCategory}`
            );
            setListings(data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [submittedKeyword, activeCategory]);

    useEffect(() => {
        fetchListings();
    }, [activeCategory, submittedKeyword, fetchListings]);

    const handleSearch = () => {
        setSubmittedKeyword(searchKeyword);
    };
    return (
        <div className="home-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to Nateurix</h1>
                    <p>The marketplace for plants, seeds, and gardening tools.</p>
                    <div className="hero-buttons">
                        <Link to="/register" className="btn-primary">Join Now</Link>
                        <Link to="/create-listing" className="btn-secondary">Start Selling</Link>
                    </div>
                </div>
            </div>

            <div className="discovery-section container" style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
                <SearchBar
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    onSearch={handleSearch}
                />
                <CategoryFilters
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            </div>

            <div className="listings-section container">
                <h2>{activeCategory === 'All' ? 'Latest Listings' : `${activeCategory}s`}</h2>
                {loading ? (
                    <div className="loader">Loading...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : listings.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                        <h3>No matches found</h3>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="listings-grid">
                        {listings.map((listing) => (
                            <ListingCard key={listing._id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
