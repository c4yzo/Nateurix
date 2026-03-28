import React, { useState } from 'react';
import './SearchBar.scss';

const SearchBar = ({ searchKeyword, setSearchKeyword, onSearch }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <form
            className={`search-bar-container ${isFocused ? 'focused' : ''}`}
            onSubmit={handleSubmit}
        >
            <div className="search-icon">🔍</div>
            <input
                type="text"
                className="search-input"
                placeholder="Search for rare plants, seeds, tools..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {searchKeyword && (
                <button
                    type="submit"
                    className="search-button-inline"
                    aria-label="Submit Search"
                >
                    →
                </button>
            )}
        </form>
    );
};

export default SearchBar;
