import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatPrice } from '../utils/priceUtils';
import { formatDate } from '../utils/dateUtils';
import './TravelerDashboard.css';

const TravelerDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await dashboardService.getTravelerDashboard();
            setDashboardData(response);
        } catch (err) {
            console.error('Load dashboard error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    const stats = dashboardData?.statistics || {};
    const upcomingTrips = dashboardData?.upcomingTrips || [];
    const recentBookings = dashboardData?.recentBookings || [];

    return (
        <div className="traveler-dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1>Welcome, {user?.name} 👋</h1>
                    <p className="dashboard-subtitle">Here's what's happening with your trips</p>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />

                {/* Statistics */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-info">
                            <h3>{stats.total_bookings || 0}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon"></div>
                        <div className="stat-info">
                            <h3>{stats.pending_bookings || 0}</h3>
                            <p>Pending Requests</p>
                        </div>
                    </div>
                    <div className="stat-card accepted">
                        <div className="stat-icon"></div>
                        <div className="stat-info">
                            <h3>{stats.accepted_bookings || 0}</h3>
                            <p>Confirmed Trips</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <Link to="/properties" className="action-btn primary">
                        Explore Properties
                    </Link>
                    <Link to="/bookings" className="action-btn">
                         View All Bookings
                    </Link>
                    <Link to="/favorites" className="action-btn">
                         My Favorites
                    </Link>
                    <Link to="/profile" className="action-btn">
                         My Profile
                    </Link>
                </div>

                {/* Upcoming Trips */}
                {upcomingTrips.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Upcoming Trips</h2>
                            <Link to="/bookings?status=ACCEPTED" className="see-all-link">
                                  See all →
                            </Link>
                        </div>
                        <div className="trips-grid">
                            {upcomingTrips.map(trip => (
                                <TripCard key={trip.booking_id} trip={trip} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Bookings */}
                {recentBookings.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Bookings</h2>
                            <Link to="/bookings" className="see-all-link">
                                See all →
                            </Link>
                        </div>
                        <div className="bookings-list">
                            {recentBookings.map(booking => (
                                <BookingItem key={booking.booking_id} booking={booking} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {upcomingTrips.length === 0 && recentBookings.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🏖️</div>
                        <h3>No trips yet</h3>
                        <p>Start exploring amazing properties and plan your next adventure!</p>
                        <Link to="/properties" className="btn btn-primary">
                            Explore Properties
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

// Trip Card Component
const TripCard = ({ trip }) => {
    const imageUrl = trip.property_image 
        ? `${process.env.REACT_APP_API_URL}${trip.property_image}`
        : 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <Link to={`/bookings/${trip.booking_id}`} className="trip-card">
            <div className="trip-image">
                <img src={imageUrl} alt={trip.property_name} onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }} />
            </div>
            <div className="trip-info">
                <h3>{trip.property_name}</h3>
                <p className="trip-location">{trip.city}, {trip.country}</p>
                <p className="trip-dates">
                    {formatDate(trip.check_in_date)} - {formatDate(trip.check_out_date)}
                </p>
                <p className="trip-price">{formatPrice(trip.total_price)}</p>
            </div>
        </Link>
    );
};

// Booking Item Component
const BookingItem = ({ booking }) => {
    const getStatusClass = (status) => {
        switch(status) {
            case 'PENDING': return 'status-pending';
            case 'ACCEPTED': return 'status-accepted';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    };

    return (
        <div className="booking-item">
            <div className="booking-main-info">
                <h4>{booking.property_name}</h4>
                <p className="booking-location"> {booking.city}, {booking.country}</p>
                <p className="booking-dates">
                    {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                </p>
            </div>
            <div className="booking-meta">
                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                    {booking.status}
                </span>
                <span className="booking-price">{formatPrice(booking.total_price)}</span>
            </div>
        </div>
    );
};

export default TravelerDashboard;