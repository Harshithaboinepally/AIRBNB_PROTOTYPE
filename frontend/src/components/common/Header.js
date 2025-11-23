import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice'; // CHANGED: import logoutUser instead of logout
import { useAuth } from '../../redux/hooks'; // ADDED: use custom hook
import './Header.css';

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Use custom hook instead of direct useSelector
    const { isAuthenticated, user } = useAuth();

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap(); // CHANGED: use logoutUser thunk
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout fails, navigate to login
            navigate('/login');
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
                                    <Link to="/owner/bookings" className="nav-link">
                                        Bookings
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