import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Home.css';

const Home = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Welcome to Airbnb'}
                    </h1>
                    <div className="hero-buttons">
                        <Link to="/properties" className="btn btn-primary btn-large">
                            Explore Properties
                        </Link>
                        {!isAuthenticated && (
                            <Link to="/signup" className="btn btn-outline btn-large">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;