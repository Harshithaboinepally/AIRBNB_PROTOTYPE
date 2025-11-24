import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
    getPropertyById, 
    clearSelectedProperty 
} from '../redux/slices/propertySlice';
import { 
    addToFavorites, 
    removeFromFavorites, 
    checkIsFavorite 
} from '../redux/slices/favoriteSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { useProperties, useAuth, useIsFavorite } from '../redux/hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import { calculateNights } from '../utils/dateUtils';
import './PropertyDetails.css';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { isAuthenticated, user } = useAuth();
    const { selectedProperty, detailsLoading: loading, error } = useProperties();
    const isFavorite = useIsFavorite(parseInt(id));
    
    const [bookingData, setBookingData] = useState({
        checkInDate: '',
        checkOutDate: '',
        numGuests: 1
    });
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        dispatch(getPropertyById(id));
        
        // Check if property is favorited
        if (isAuthenticated && user?.userType === 'traveler') {
            dispatch(checkIsFavorite(parseInt(id)));
        }
        
        return () => {
            dispatch(clearSelectedProperty());
        };
    }, [dispatch, id, isAuthenticated, user]);

    const handleToggleFavorite = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.userType !== 'traveler') {
            return;
        }

        if (isFavorite) {
            dispatch(removeFromFavorites(parseInt(id)));
        } else {
            dispatch(addToFavorites(parseInt(id)));
        }
    };

    const handleBookingChange = (e) => {
        const { name, value } = e.target;
        setBookingData({
            ...bookingData,
            [name]: value
        });
        setBookingError(''); // Clear error when user makes changes
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingError('');
        setBookingSuccess('');
        setIsProcessing(true);

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.userType !== 'traveler') {
            setBookingError('Only travelers can make bookings');
            setIsProcessing(false);
            return;
        }

        // Validation
        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            setBookingError('Please select check-in and check-out dates');
            setIsProcessing(false);
            return;
        }

        const checkIn = new Date(bookingData.checkInDate);
        const checkOut = new Date(bookingData.checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkIn < today) {
            setBookingError('Check-in date cannot be in the past');
            setIsProcessing(false);
            return;
        }

        if (checkOut <= checkIn) {
            setBookingError('Check-out date must be after check-in date');
            setIsProcessing(false);
            return;
        }

        if (bookingData.numGuests < 1) {
            setBookingError('Number of guests must be at least 1');
            setIsProcessing(false);
            return;
        }

        if (selectedProperty && bookingData.numGuests > selectedProperty.max_guests) {
            setBookingError(`Number of guests cannot exceed ${selectedProperty.max_guests}`);
            setIsProcessing(false);
            return;
        }

        try {
            const nights = calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
            const totalPrice = nights * selectedProperty.price_per_night;

            const booking = {
                property_id: parseInt(id),
                check_in_date: bookingData.checkInDate,
                check_out_date: bookingData.checkOutDate,
                num_guests: parseInt(bookingData.numGuests),
                total_price: totalPrice
            };

            const result = await dispatch(createBooking(booking));
            
            if (createBooking.fulfilled.match(result)) {
                setBookingSuccess('Booking request submitted successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/bookings');
                }, 2000);
            } else {
                setBookingError(result.payload || 'Failed to create booking. Please try again.');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Booking error:', err);
            setBookingError('An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    const calculateTotalPrice = () => {
        if (!bookingData.checkInDate || !bookingData.checkOutDate || !selectedProperty) {
            return 0;
        }
        try {
            const nights = calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
            return nights * selectedProperty.price_per_night;
        } catch (error) {
            return 0;
        }
    };

    const getNightsCount = () => {
        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            return 0;
        }
        try {
            return calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
        } catch (error) {
            return 0;
        }
    };

    // Helper function to safely parse amenities
    const getAmenitiesList = () => {
        if (!selectedProperty?.amenities) return [];
        
        try {
            // Handle string (comma-separated)
            if (typeof selectedProperty.amenities === 'string') {
                return selectedProperty.amenities
                    .split(',')
                    .map(a => a.trim())
                    .filter(a => a.length > 0);
            }
            
            // Handle array
            if (Array.isArray(selectedProperty.amenities)) {
                return selectedProperty.amenities
                    .map(a => typeof a === 'string' ? a.trim() : String(a))
                    .filter(a => a.length > 0);
            }
            
            return [];
        } catch (error) {
            console.error('Error parsing amenities:', error);
            return [];
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading property details..." />;
    }

    if (error) {
        return (
            <div className="container">
                <ErrorMessage message={error} />
                <button onClick={() => navigate('/properties')} className="btn btn-primary">
                    Back to Properties
                </button>
            </div>
        );
    }

    if (!selectedProperty) {
        return (
            <div className="container">
                <div className="empty-state">
                    <h2>Property not found</h2>
                    <p>The property you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/properties')} className="btn btn-primary">
                        Back to Properties
                    </button>
                </div>
            </div>
        );
    }

    const imageUrl = selectedProperty.primary_image
        ? `${process.env.REACT_APP_API_URL}${selectedProperty.primary_image}`
        : 'https://via.placeholder.com/800x600?text=No+Image';

    const minCheckIn = new Date().toISOString().split('T')[0];
    const amenitiesList = getAmenitiesList();

    return (
        <div className="property-details-page">
            <div className="container">
                {/* Property Images */}
                <div className="property-images">
                    <img 
                        src={imageUrl} 
                        alt={selectedProperty.property_name}
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
                        }}
                    />
                </div>

                <div className="property-content">
                    {/* Property Info */}
                    <div className="property-main">
                        <div className="property-header">
                            <div>
                                <h1>{selectedProperty.property_name}</h1>
                                <p className="property-location">
                                    📍 {selectedProperty.city}
                                    {selectedProperty.state && `, ${selectedProperty.state}`}
                                    {selectedProperty.country && `, ${selectedProperty.country}`}
                                </p>
                            </div>
                            {isAuthenticated && user?.userType === 'traveler' && (
                                <button 
                                    onClick={handleToggleFavorite}
                                    className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                                </button>
                            )}
                        </div>

                        <div className="property-highlights">
                            <span>🏠 {selectedProperty.property_type || 'Property'}</span>
                            <span>🛏️ {selectedProperty.bedrooms || 0} Bedrooms</span>
                            <span>🚿 {selectedProperty.bathrooms || 0} Bathrooms</span>
                            <span>👥 {selectedProperty.max_guests || 0} Guests</span>
                        </div>

                        <div className="property-description">
                            <h2>About this property</h2>
                            <p>{selectedProperty.description || 'No description available.'}</p>
                        </div>

                        {amenitiesList.length > 0 && (
                            <div className="property-amenities">
                                <h2>Amenities</h2>
                                <div className="amenities-list">
                                    {amenitiesList.map((amenity, index) => (
                                        <div key={index} className="amenity-item">
                                            ✓ {amenity}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booking Card */}
                    <div className="booking-card">
                        <div className="price-header">
                            <span className="price">{formatPrice(selectedProperty.price_per_night)}</span>
                            <span className="price-period"> / night</span>
                        </div>

                        {isAuthenticated && user?.userType === 'traveler' ? (
                            <>
                                {!showBookingForm ? (
                                    <button
                                        onClick={() => setShowBookingForm(true)}
                                        className="btn btn-primary btn-full"
                                    >
                                        Reserve
                                    </button>
                                ) : (
                                    <form onSubmit={handleBookingSubmit} className="booking-form">
                                        <ErrorMessage message={bookingError} onClose={() => setBookingError('')} />
                                        <SuccessMessage message={bookingSuccess} onClose={() => setBookingSuccess('')} />

                                        <div className="form-group">
                                            <label className="form-label">Check In</label>
                                            <input
                                                type="date"
                                                name="checkInDate"
                                                value={bookingData.checkInDate}
                                                onChange={handleBookingChange}
                                                className="form-input"
                                                min={minCheckIn}
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Check Out</label>
                                            <input
                                                type="date"
                                                name="checkOutDate"
                                                value={bookingData.checkOutDate}
                                                onChange={handleBookingChange}
                                                className="form-input"
                                                min={bookingData.checkInDate || minCheckIn}
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Guests</label>
                                            <input
                                                type="number"
                                                name="numGuests"
                                                value={bookingData.numGuests}
                                                onChange={handleBookingChange}
                                                className="form-input"
                                                min="1"
                                                max={selectedProperty.max_guests}
                                                required
                                                disabled={isProcessing}
                                            />
                                            <small className="form-helper">
                                                Maximum {selectedProperty.max_guests} guests
                                            </small>
                                        </div>

                                        {getNightsCount() > 0 && (
                                            <div className="booking-summary">
                                                <div className="summary-row">
                                                    <span>
                                                        {formatPrice(selectedProperty.price_per_night)} × {getNightsCount()} {getNightsCount() === 1 ? 'night' : 'nights'}
                                                    </span>
                                                    <span>{formatPrice(calculateTotalPrice())}</span>
                                                </div>
                                                <div className="summary-total">
                                                    <strong>Total</strong>
                                                    <strong>{formatPrice(calculateTotalPrice())}</strong>
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary btn-full"
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'Processing...' : 'Request to Book'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setShowBookingForm(false);
                                                setBookingError('');
                                                setBookingSuccess('');
                                            }}
                                            className="btn btn-secondary btn-full"
                                            disabled={isProcessing}
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                )}
                            </>
                        ) : user?.userType === 'owner' ? (
                            <div className="booking-note">
                                <p>Property owners cannot book properties.</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary btn-full"
                            >
                                Login to Book
                            </button>
                        )}

                        {(!user || user?.userType === 'traveler') && (
                            <p className="booking-note">You won't be charged yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;