import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
    getTravelerBookings, 
    cancelBooking, 
    setActiveTab, 
    clearSuccessMessages,
    clearError 
} from '../redux/slices/bookingSlice';
import { useBookings } from '../redux/hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import { formatDate, calculateNights } from '../utils/dateUtils';
import './Bookings.css';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e0e0e0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="Arial, sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const Bookings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    // Redux state using custom hook
    const { 
        items: bookings, 
        loading, 
        error, 
        cancelSuccess, 
        activeTab,
        actionLoading 
    } = useBookings();
    
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        const tab = searchParams.get('status') || 'all';
        dispatch(setActiveTab(tab));
        
        const status = tab === 'all' ? null : tab.toUpperCase();
        dispatch(getTravelerBookings(status));
    }, [dispatch, searchParams]);

    useEffect(() => {
        if (cancelSuccess) {
            setLocalSuccess('Booking cancelled successfully');
            dispatch(clearSuccessMessages());
            
            // Reload bookings after cancellation
            const status = activeTab === 'all' ? null : activeTab.toUpperCase();
            dispatch(getTravelerBookings(status));
            
            setTimeout(() => setLocalSuccess(''), 3000);
        }
    }, [cancelSuccess, dispatch, activeTab]);

    const handleCancelBooking = (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        dispatch(cancelBooking({ bookingId, reason: 'Cancelled by traveler' }));
    };

    const handleTabChange = (tab) => {
        dispatch(setActiveTab(tab));
        if (tab === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ status: tab });
        }
        
        const status = tab === 'all' ? null : tab.toUpperCase();
        dispatch(getTravelerBookings(status));
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

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
                <SuccessMessage message={localSuccess} onClose={() => setLocalSuccess('')} />

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
                                isLoading={actionLoading}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel, isLoading }) => {
    const nights = calculateNights(booking.check_in_date, booking.check_out_date);

    const getStatusClass = (status) => {
        switch(status) {
            case 'PENDING': return 'status-pending';
            case 'ACCEPTED': return 'status-accepted';
            case 'CANCELLED': return 'status-cancelled';
            case 'REJECTED': return 'status-rejected';
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
                                disabled={isLoading}
                            >
                                {isLoading ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookings;