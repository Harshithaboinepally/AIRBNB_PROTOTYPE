import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import bookingService from '../services/bookingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import { formatDate, calculateNights } from '../utils/dateUtils';
import './Bookings.css';

// Placeholder image as data URI (works offline, no external requests)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e0e0e0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="Arial, sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const Bookings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');

    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const status = activeTab === 'all' ? null : activeTab.toUpperCase();
            const response = await bookingService.getTravelerBookings(status);
            setBookings(response.bookings);
        } catch (err) {
            console.error('Load bookings error:', err);
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await bookingService.cancelBooking(bookingId, 'Cancelled by traveler');
            setSuccess('Booking cancelled successfully');
            loadBookings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Cancel booking error:', err);
            setError(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ status: tab });
        }
    };

    const filteredBookings = activeTab === 'all' 
        ? bookings 
        : bookings.filter(b => b.status === activeTab.toUpperCase());

    if (loading) {
        return <LoadingSpinner message="Loading bookings..." />;
    }

    return (
        <div className="bookings-page">
            <div className="container">
                <h1 className="page-title">My Bookings</h1>

                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                {/* Tabs */}
                <div className="bookings-tabs">
                    <button 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        All ({bookings.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => handleTabChange('pending')}
                    >
                        Pending ({bookings.filter(b => b.status === 'PENDING').length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
                        onClick={() => handleTabChange('accepted')}
                    >
                        Confirmed ({bookings.filter(b => b.status === 'ACCEPTED').length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                        onClick={() => handleTabChange('cancelled')}
                    >
                        Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})
                    </button>
                </div>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
                    <div className="empty-bookings">
                        <div className="empty-icon">📅</div>
                        <h3>No bookings found</h3>
                        <p>
                            {activeTab === 'pending' && 'No pending bookings at the moment.'}
                            {activeTab === 'accepted' && 'No confirmed bookings yet.'}
                            {activeTab === 'cancelled' && 'No cancelled bookings.'}
                            {activeTab === 'all' && 'Start exploring and book your dream property!'}
                        </p>
                        <Link to="/properties" className="btn btn-primary">
                            Explore Properties
                        </Link>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map(booking => (
                            <BookingCard 
                                key={booking.booking_id} 
                                booking={booking}
                                onCancel={handleCancelBooking}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel }) => {
    const nights = calculateNights(booking.check_in_date, booking.check_out_date);

    const getStatusClass = (status) => {
        switch(status) {
            case 'PENDING': return 'status-pending';
            case 'ACCEPTED': return 'status-accepted';
            case 'CANCELLED': return 'status-cancelled';
            default: return '';
        }
    };

    const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';

    // Use PLACEHOLDER_IMAGE if no image
    const imageUrl = booking.primary_image 
        ? `${process.env.REACT_APP_API_URL}${booking.primary_image}`
        : PLACEHOLDER_IMAGE;

    return (
        <div className={`booking-card ${booking.status === 'PENDING' ? 'urgent' : ''}`}>
            <div className="booking-property-image">
                <img 
                    src={imageUrl} 
                    alt={booking.property_name}
                    onError={(e) => {
                        // If image fails to load, use placeholder
                        e.target.src = PLACEHOLDER_IMAGE;
                    }}
                />
            </div>

            <div className="booking-details">
                <div className="booking-header">
                    <div className="booking-title">
                        <h3>{booking.property_name}</h3>
                        <span className="property-location">
                            {booking.city}, {booking.country}
                        </span>
                    </div>
                    <span className={`booking-status-badge ${getStatusClass(booking.status)}`}>
                        {booking.status}
                    </span>
                </div>

                <div className="booking-info">
                    <div className="info-item">
                        <span className="info-label">Check In</span>
                        <span className="info-value">{formatDate(booking.check_in_date)}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Check Out</span>
                        <span className="info-value">{formatDate(booking.check_out_date)}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Nights</span>
                        <span className="info-value">{nights}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Guests</span>
                        <span className="info-value">{booking.num_guests}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Total Price</span>
                        <span className="info-value price">{formatPrice(booking.total_price)}</span>
                    </div>
                </div>

                <div className="booking-footer">
                    <span className="booking-date">
                        Booked on {formatDate(booking.booking_date)}
                    </span>
                    <div className="booking-actions">
                        <Link 
                            to={`/properties/${booking.property_id}`}
                            className="view-property-link"
                        >
                            View Property
                        </Link>
                        {canCancel && (
                            <button 
                                onClick={() => onCancel(booking.booking_id)}
                                className="btn-cancel"
                            >
                                Cancel Booking
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookings;