import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.scss';

const NotFound = () => {
    return (
        <div className="not-found-container container">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <h1>Oops! This page sprouted legs and walked away.</h1>
                <p>We can't seem to find the page you're looking for. It might have been removed, renamed, or perhaps it never existed in our garden.</p>
                <Link to="/" className="btn-primary">
                    Return to Green Pastures
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
