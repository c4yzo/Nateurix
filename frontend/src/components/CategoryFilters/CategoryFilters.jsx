import React from 'react';
import './CategoryFilters.scss';

const CategoryFilters = ({ activeCategory, setActiveCategory }) => {
    const categories = [
        { id: 'All', icon: '🌿', label: 'All Items' },
        { id: 'Plant', icon: '🪴', label: 'Plants' },
        { id: 'Seed', icon: '🌱', label: 'Seeds' },
        { id: 'Tool', icon: '🪏', label: 'Tools' },
        { id: 'Fertilizer', icon: '🧪', label: 'Fertilizers' }
    ];

    return (
        <div className="category-filters-container">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                    aria-pressed={activeCategory === cat.id}
                >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-label">{cat.label}</span>
                </button>
            ))}
        </div>
    );
};

export default CategoryFilters;
