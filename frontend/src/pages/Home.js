import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    return (
    <div className="home-container">
        <section className="hero-section">
            <div className="hero-content">
                <h1 className="hero-title">Welcome to Airbnb</h1>
                <div className="hero-buttons">
                    <Link to="/properties" className="btn btn-primary btn-large">
                        Explore Properties
                    </Link>
                    <Link to="/signup" className="btn btn-outline btn-large">
                        Get Started
                    </Link>
                </div>
            </div>
        </section>
    </div>
);
};

export default Home;