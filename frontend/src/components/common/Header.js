import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <span className="logo-icon">🏠</span>
                    <span className="logo-text">Airbnb</span>
                </Link>

                <nav className="nav-menu">
                    {isAuthenticated ? (
                        <>
                            <Link to={user?.userType === 'traveler' ? '/dashboard' : '/owner/dashboard'} className="nav-link">
                                Dashboard
                            </Link>

                            {user?.userType === 'traveler' && (
                                <>
                                    <Link to="/properties" className="nav-link">
                                        Explore
                                    </Link>
                                    <Link to="/favorites" className="nav-link">
                                        Favorites
                                    </Link>
                                    <Link to="/bookings" className="nav-link">
                                        Trips
                                    </Link>
                                </>
                            )}

                            {user?.userType === 'owner' && (
                                <>
                                    <Link to="/owner/properties" className="nav-link">
                                        My Properties
                                    </Link>
                                </>
                            )}

                            <div className="user-menu">
                                <Link to="/profile" className="nav-link">
                                    {user?.profilePicture ? (
                                        <img 
                                            src={`${process.env.REACT_APP_API_URL}${user.profilePicture}`} 
                                            alt="Profile" 
                                            className="profile-pic-small"
                                        />
                                    ) : (
                                        <span className="user-icon">👤</span>
                                    )}
                                    <span>{user?.name}</span>
                                </Link>
                                <button onClick={handleLogout} className="logout-btn">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/properties" className="nav-link">
                                Explore
                            </Link>
                            <Link to="/login" className="nav-link">
                                Login
                            </Link>
                            <Link to="/signup" className="btn-primary">
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;