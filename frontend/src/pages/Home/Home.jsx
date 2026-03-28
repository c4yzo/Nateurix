import React, { useState, useEffect, useCallback } from 'react';
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
            <div className="discovery-header">
                <div className="hero-mesh-background">
                    <div className="mesh-blob blob-1"></div>
                    <div className="mesh-blob blob-2"></div>
                </div>

                <div className="hero-content">
                    <h1 className="hero-title">Cultivate Your Green Space</h1>
                    <p className="hero-subtitle">
                        Discover rare seeds, beautiful plants, and premium tools from local growers.
                    </p>

                    <div className="search-wrapper">
                        <SearchBar
                            searchKeyword={searchKeyword}
                            setSearchKeyword={setSearchKeyword}
                            onSearch={handleSearch}
                        />
                    </div>
                </div>
            </div>

            <div className="filters-section container">
                <CategoryFilters
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            </div>

            <div className="listings-section container">
                <div className="listings-header">
                    <h2>{activeCategory === 'All' ? 'Latest Additions' : `${activeCategory}s`}</h2>
                    <span className="results-count">
                        {!loading && !error && `${listings.length} items found`}
                    </span>
                </div>

                {loading ? (
                    <div className="loader">Loading...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : listings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🌱</div>
                        <h3>No matches found</h3>
                        <p>Try adjusting your search or category filters.</p>
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
