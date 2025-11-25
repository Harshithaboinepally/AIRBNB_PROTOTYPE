import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../redux/hooks';
import { getOwnerBookings } from '../redux/slices/bookingSlice';
import dashboardService from '../services/dashboardService';
import bookingService from '../services/bookingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatPrice } from '../utils/priceUtils';
import { formatDate } from '../utils/dateUtils';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboard();
        // Load owner bookings into Redux
        dispatch(getOwnerBookings());
    }, [dispatch]);

    const loadDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await dashboardService.getOwnerDashboard();
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

    const propertyStats = dashboardData?.propertyStatistics || {};
    const bookingStats = dashboardData?.bookingStatistics || {};
    const pendingRequests = dashboardData?.pendingRequests || [];
    const upcomingBookings = dashboardData?.upcomingBookings || [];
    const recentProperties = dashboardData?.recentProperties || [];

    return (
        <div className="owner-dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1>Welcome, {user?.name}! 🏡</h1>
                    <p className="dashboard-subtitle">Manage your properties and bookings</p>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />

                {/* Statistics */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🏘️</div>
                        <div className="stat-info">
                            <h3>{propertyStats.total_properties || 0}</h3>
                            <p>Total Properties</p>
                        </div>
                    </div>
                    <div className="stat-card available">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{propertyStats.available_properties || 0}</h3>
                            <p>Available Properties</p>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{bookingStats.pending_bookings || 0}</h3>
                            <p>Pending Requests</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <Link to="/owner/properties" className="action-btn primary">
                        ➕ Add New Property
                    </Link>
                    <Link to="/owner/properties" className="action-btn">
                        🏠 View All Properties
                    </Link>
                    <Link to="/owner/bookings" className="action-btn">
                        📅 Manage Bookings
                    </Link>
                    <Link to="/profile" className="action-btn">
                        👤 My Profile
                    </Link>
                </div>

                {/* Pending Booking Requests */}
                {pendingRequests.length > 0 && (
                    <div className="dashboard-section urgent">
                        <div className="section-header">
                            <h2>⚠️ Pending Booking Requests</h2>
                            <Link to="/owner/bookings?status=pending" className="see-all-link">
                                See all →
                            </Link>
                        </div>
                        <div className="requests-list">
                            {pendingRequests.map(request => (
                                <PendingRequestCard 
                                    key={request.booking_id} 
                                    request={request} 
                                    onUpdate={loadDashboard} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Upcoming Bookings</h2>
                            <Link to="/owner/bookings?status=accepted" className="see-all-link">
                                See all →
                            </Link>
                        </div>
                        <div className="bookings-list">
                            {upcomingBookings.map(booking => (
                                <UpcomingBookingCard key={booking.booking_id} booking={booking} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Properties */}
                {recentProperties.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Your Properties</h2>
                            <Link to="/owner/properties" className="see-all-link">
                                See all →
                            </Link>
                        </div>
                        <div className="properties-grid">
                            {recentProperties.map(property => (
                                <PropertyCard key={property.property_id} property={property} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {recentProperties.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🏡</div>
                        <h3>No properties yet</h3>
                        <p>Start by adding your first property to get bookings!</p>
                        <Link to="/owner/properties" className="btn btn-primary">
                            Add Property
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

// Pending Request Card Component
const PendingRequestCard = ({ request, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleAccept = async () => {
        if (!window.confirm('Accept this booking request?')) return;
        
        setLoading(true);
        try {
            await bookingService.acceptBooking(request.booking_id);
            // Update Redux state
            dispatch(getOwnerBookings());
            onUpdate();
        } catch (err) {
            console.error('Accept booking error:', err);
            alert(err.response?.data?.message || 'Failed to accept booking');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel this booking request?')) return;
        
        setLoading(true);
        try {
            await bookingService.cancelBooking(request.booking_id, 'Declined by owner');
            // Update Redux state
            dispatch(getOwnerBookings());
            onUpdate();
        } catch (err) {
            console.error('Cancel booking error:', err);
            alert(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pending-request-card">
            <div className="request-info">
                <h4>{request.property_name}</h4>
                <p className="traveler-name">👤 {request.traveler_name}</p>
                <p className="booking-dates">
                    📅 {formatDate(request.check_in_date)} - {formatDate(request.check_out_date)}
                </p>
                <p className="booking-guests">👥 {request.num_guests} guests</p>
                <p className="booking-price">{formatPrice(request.total_price)}</p>
            </div>
            <div className="request-actions">
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="btn btn-accept"
                >
                    {loading ? 'Processing...' : '✓ Accept'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="btn btn-decline"
                >
                    ✗ Decline
                </button>
            </div>
        </div>
    );
};

// Upcoming Booking Card Component
const UpcomingBookingCard = ({ booking }) => {
    return (
        <div className="upcoming-booking-card">
            <div className="booking-info">
                <h4>{booking.property_name}</h4>
                <p className="traveler-name">👤 {booking.traveler_name}</p>
                <p className="booking-dates">
                    📅 {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                </p>
            </div>
            <div className="booking-meta">
                <span className="booking-status confirmed">CONFIRMED</span>
                <span className="booking-price">{formatPrice(booking.total_price)}</span>
            </div>
        </div>
    );
};

// Property Card Component
const PropertyCard = ({ property }) => {
    const imageUrl = property.primary_image
        ? `${process.env.REACT_APP_UPLOADS_URL}${property.primary_image}`
        : 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <Link to={`/properties/${property.property_id}`} className="property-card">
            <div className="property-image">
                <img src={imageUrl} alt={property.property_name} onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }} />
                <div className={`availability-badge ${property.is_available ? 'available' : 'unavailable'}`}>
                    {property.is_available ? 'Available' : 'Unavailable'}
                </div>
            </div>
            <div className="property-info">
                <h3>{property.property_name}</h3>
                <p className="property-location">📍 {property.city}, {property.country}</p>
                <p className="property-details">
                    {property.bedrooms} bed · {property.bathrooms} bath
                </p>
                <div className="property-footer">
                    <span className="property-price">{formatPrice(property.price_per_night)}/night</span>
                    {property.pending_bookings > 0 && (
                        <span className="pending-badge">
                            {property.pending_bookings} pending
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default OwnerDashboard;