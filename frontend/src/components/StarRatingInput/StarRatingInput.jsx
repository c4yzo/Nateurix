import React, { useState } from 'react';
import './StarRatingInput.scss';

const StarRatingInput = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-rating-input">
            {[...Array(5)].map((_, index) => {
                index += 1;
                return (
                    <button
                        type="button"
                        key={index}
                        className={index <= (hover || rating) ? "star on" : "star off"}
                        onClick={() => setRating(index)}
                        onMouseEnter={() => setHover(index)}
                        onMouseLeave={() => setHover(rating)}
                    >
                        <span className="star-char">&#9733;</span>
                    </button>
                );
            })}
        </div>
    );
};

export default StarRatingInput;
