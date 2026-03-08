import React from 'react';
import './SearchBar.scss';

const SearchBar = ({ searchKeyword, setSearchKeyword, onSearch }) => {

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <form className="search-bar-container" onSubmit={handleSubmit}>
            <input
                type="text"
                className="search-input"
                placeholder="Search for plants, seeds, tools..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit" className="search-button">
                Search
            </button>
        </form>
    );
};

export default SearchBar;
