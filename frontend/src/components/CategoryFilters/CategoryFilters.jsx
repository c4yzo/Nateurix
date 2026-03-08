import React from 'react';
import './CategoryFilters.scss';

const CategoryFilters = ({ activeCategory, setActiveCategory }) => {
    const categories = ['All', 'Plant', 'Seed', 'Tool', 'Fertilizer'];

    return (
        <div className="category-filters-container">
            {categories.map((category) => (
                <button
                    key={category}
                    className={`category-pill ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilters;
