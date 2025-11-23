import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
    getOwnerBookings, 
    acceptBooking, 
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
import './OwnerBookings.css';

const OwnerBookings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    // Redux state
    const { 
        ownerBookings: bookings, 
        loading, 
        error, 
        acceptSuccess,
        cancelSuccess,
        activeTab,
        actionLoading 
    } = useBookings();
    
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        const tab = searchParams.get('status') || 'all';
        dispatch(setActiveTab(tab));
        
        const status = tab === 'all' ? null : tab.toUpperCase();
        dispatch(getOwnerBookings(status));
    }, [dispatch, searchParams]);

    useEffect(() => {
        if (acceptSuccess) {
            setLocalSuccess('Booking accepted successfully!');
            dispatch(clearSuccessMessages());
            
            // Reload bookings
            const status = activeTab === 'all' ? null : activeTab.toUpperCase();
            dispatch(getOwnerBookings(status));
            
            setTimeout(() => setLocalSuccess(''), 3000);
        }
    }, [acceptSuccess, dispatch, activeTab]);

    useEffect(() => {
        if (cancelSuccess) {
            setLocalSuccess('Booking cancelled successfully');
            dispatch(clearSuccessMessages());
            
            // Reload bookings
            const status = activeTab === 'all' ? null : activeTab.toUpperCase();
            dispatch(getOwnerBookings(status));
            
            setTimeout(() => setLocalSuccess(''), 3000);
        }
    }, [cancelSuccess, dispatch, activeTab]);

    const handleAcceptBooking = (bookingId) => {
        if (!window.confirm('Accept this booking request?')) {
            return;
        }

        dispatch(acceptBooking(bookingId));
    };

    const handleCancelBooking = (bookingId) => {
        const reason = window.prompt('Please enter a cancellation reason (optional):');
        if (reason === null) return; // User clicked Cancel

        dispatch(cancelBooking({ 
            bookingId, 
            reason: reason || 'Cancelled by owner' 
        }));
    };

    const handleTabChange = (tab) => {
        dispatch(setActiveTab(tab));
        if (tab === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ status: tab });
        }
        
        const status = tab === 'all' ? null : tab.toUpperCase();
        dispatch(getOwnerBookings(status));
    };

    const filteredBookings = activeTab === 'all' 
        ? bookings 
        : bookings.filter(b => b.status === activeTab.toUpperCase());

    if (loading) {
        return <LoadingSpinner message="Loading bookings..." />;
    }

    return (
        <div className="owner-bookings-page">
            <div className="container">
                <h1 className="page-title">Booking Management</h1>

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
                <SuccessMessage message={localSuccess} onClose={() => setLocalSuccess('')} />

                {/* Tabs */}
                <div className="bookings-tabs">
                    <button 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        All Bookings ({bookings.length})
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
                            {activeTab === 'pending' && 'No pending booking requests at the moment.'}
                            {activeTab === 'accepted' && 'No confirmed bookings yet.'}
                            {activeTab === 'cancelled' && 'No cancelled bookings.'}
                            {activeTab === 'all' && 'No bookings yet. Make sure your properties are listed and available!'}
                        </p>
                        <Link to="/owner/properties" className="btn btn-primary">
                            View My Properties
                        </Link>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map(booking => (
                            <OwnerBookingCard 
                                key={booking.booking_id} 
                                booking={booking}
                                onAccept={handleAcceptBooking}
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

// Owner Booking Card Component
const OwnerBookingCard = ({ booking, onAccept, onCancel, isLoading }) => {
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

    const canAccept = booking.status === 'PENDING';
    const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';

    return (
        <div className={`owner-booking-card ${booking.status === 'PENDING' ? 'urgent' : ''}`}>
            <div className="booking-header">
                <div className="booking-title">
                    <h3>{booking.property_name}</h3>
                    <span className={`booking-status-badge ${getStatusClass(booking.status)}`}>
                        {booking.status}
                    </span>
                </div>
                <Link 
                    to={`/properties/${booking.property_id}`}
                    className="view-property-link"
                >
                    View Property →
                </Link>
            </div>

            <div className="booking-body">
                <div className="booking-info-section">
                    <div className="info-row">
                        <div className="info-item">
                            <span className="info-icon">👤</span>
                            <div>
                                <p className="info-label">Guest</p>
                                <p className="info-value">{booking.traveler_name}</p>
                                <p className="info-sub">{booking.traveler_email}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div>
                                <p className="info-label">Check In</p>
                                <p className="info-value">{formatDate(booking.check_in_date)}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div>
                                <p className="info-label">Check Out</p>
                                <p className="info-value">{formatDate(booking.check_out_date)}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">🌙</span>
                            <div>
                                <p className="info-label">Duration</p>
                                <p className="info-value">{nights} night{nights !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">👥</span>
                            <div>
                                <p className="info-label">Guests</p>
                                <p className="info-value">{booking.num_guests}</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">💰</span>
                            <div>
                                <p className="info-label">Total Amount</p>
                                <p className="info-value highlight">{formatPrice(booking.total_price)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="booking-meta">
                        <p className="booking-date">
                            Requested on {formatDate(booking.booking_date)}
                        </p>
                    </div>
                </div>

                {(canAccept || canCancel) && (
                    <div className="booking-actions">
                        {canAccept && (
                            <button 
                                onClick={() => onAccept(booking.booking_id)}
                                className="btn btn-accept"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : '✓ Accept Booking'}
                            </button>
                        )}
                        {canCancel && (
                            <button 
                                onClick={() => onCancel(booking.booking_id)}
                                className="btn btn-cancel"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : '✗ Cancel Booking'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerBookings;