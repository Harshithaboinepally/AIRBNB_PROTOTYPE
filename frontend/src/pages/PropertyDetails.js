import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import propertyService from '../services/propertyService';
import bookingService from '../services/bookingService';
import favoriteService from '../services/favoriteService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import { calculateNights, getTodayDate, getTomorrowDate } from '../utils/dateUtils';
import './PropertyDetails.css';

// Placeholder image as data URI
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3Crect fill="%23e0e0e0" width="1200" height="600"/%3E%3Ctext fill="%23999" font-family="Arial, sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [bookingData, setBookingData] = useState({
        check_in_date: getTodayDate(),
        check_out_date: getTomorrowDate(),
        num_guests: 1
    });
    const [bookingLoading, setBookingLoading] = useState(false);

    const loadProperty = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await propertyService.getPropertyById(id);
            setProperty(response.property);
        } catch (err) {
            console.error('Load property error:', err);
            setError('Failed to load property details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const checkIfFavorited = useCallback(async () => {
        try {
            const response = await favoriteService.checkFavorite(id);
            setIsFavorited(response.isFavorited);
        } catch (err) {
            console.error('Check favorite error:', err);
        }
    }, [id]);

    useEffect(() => {
        loadProperty();
        if (isAuthenticated && user?.userType === 'traveler') {
            checkIfFavorited();
        }
    }, [loadProperty, checkIfFavorited, isAuthenticated, user]);

    const handleFavoriteToggle = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorited) {
                await favoriteService.removeFavorite(id);
                setIsFavorited(false);
                setSuccess('Removed from favorites');
            } else {
                await favoriteService.addFavorite(id);
                setIsFavorited(true);
                setSuccess('Added to favorites');
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Favorite toggle error:', err);
            setError(err.response?.data?.message || 'Failed to update favorites');
        }
    };

    const handleBookingChange = (e) => {
        setBookingData({
            ...bookingData,
            [e.target.name]: e.target.value
        });
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.userType !== 'traveler') {
            setError('Only travelers can book properties');
            return;
        }

        setError('');
        setBookingLoading(true);

        try {
            await bookingService.createBooking({
                property_id: parseInt(id),
                ...bookingData
            });

            setSuccess('Booking request sent successfully!');
            setTimeout(() => {
                navigate('/bookings');
            }, 2000);
        } catch (err) {
            console.error('Booking error:', err);
            setError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setBookingLoading(false);
        }
    };

    const calculateTotalPrice = () => {
        if (!property || !bookingData.check_in_date || !bookingData.check_out_date) {
            return 0;
        }
        const nights = calculateNights(bookingData.check_in_date, bookingData.check_out_date);
        return nights * parseFloat(property.price_per_night);
    };

    const nights = bookingData.check_in_date && bookingData.check_out_date
        ? calculateNights(bookingData.check_in_date, bookingData.check_out_date)
        : 0;

    if (loading) {
        return <LoadingSpinner message="Loading property..." />;
    }

    if (!property) {
        return (
            <div className="container" style={{ padding: '2rem' }}>
                <ErrorMessage message="Property not found" />
            </div>
        );
    }

    const primaryImage = property.images?.find(img => img.is_primary)?.image_url 
        || property.images?.[0]?.image_url
        || PLACEHOLDER_IMAGE;

    return (
        <div className="property-details-page">
            <div className="container">
                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                {/* Property Header */}
                <div className="property-header">
                    <h1 className="property-title">{property.property_name}</h1>
                    <div className="property-header-info">
                        <span className="property-location">
                            {property.location}, {property.city}, {property.country}
                        </span>
                        {isAuthenticated && user?.userType === 'traveler' && (
                            <button 
                                onClick={handleFavoriteToggle}
                                className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                            >
                                {isFavorited ? 'Favorited' : 'Add to Favorites'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Property Images - Swiper */}
                <div className="property-images-swiper">
                    <div className="main-image-slider">
                        <button 
                            className="slider-btn prev"
                            onClick={() => setCurrentImageIndex(prev => 
                                prev === 0 ? (property.images?.length || 1) - 1 : prev - 1
                            )}
                        >
                            ‹
                        </button>
                        <img 
                            src={`${process.env.REACT_APP_API_URL}${property.images?.[currentImageIndex]?.image_url || primaryImage}`}
                            alt={property.property_name}
                            onError={(e) => {
                                e.target.src = PLACEHOLDER_IMAGE;
                            }}
                        />
                        <button 
                            className="slider-btn next"
                            onClick={() => setCurrentImageIndex(prev => 
                                prev === (property.images?.length || 1) - 1 ? 0 : prev + 1
                            )}
                        >
                            ›
                        </button>
                        <div className="image-counter">
                            {currentImageIndex + 1} / {property.images?.length || 1}
                        </div>
                    </div>
                </div>

                <div className="property-content">
                    {/* Property Info */}
                    <div className="property-main-info">
                        <div className="property-stats">
                            <div className="stat-item">
                                <span className="stat-label">Bedrooms</span>
                                <span className="stat-value">{property.bedrooms}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Bathrooms</span>
                                <span className="stat-value">{property.bathrooms}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Max Guests</span>
                                <span className="stat-value">{property.max_guests}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Type</span>
                                <span className="stat-value property-type-text">{property.property_type}</span>
                            </div>
                        </div>

                        <div className="property-description">
                            <h2>About this place</h2>
                            <p>{property.description || 'No description available.'}</p>
                        </div>

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <div className="property-amenities">
                                <h2>Amenities</h2>
                                <div className="amenities-grid">
                                    {property.amenities.map((amenity, index) => (
                                        <div key={index} className="amenity-item">
                                            {amenity}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Host Info */}
                        <div className="host-info">
                            <h2>Hosted by {property.owner_name}</h2>
                            <div className="host-details">
                                {property.owner_picture && (
                                    <img 
                                        src={`${process.env.REACT_APP_API_URL}${property.owner_picture}`}
                                        alt={property.owner_name}
                                        className="host-avatar"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div>
                                    <p className="host-name">{property.owner_name}</p>
                                    <p className="host-email">{property.owner_email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Card - Only for Travelers or Non-authenticated Users */}
                    {(!isAuthenticated || user?.userType === 'traveler') && (
                        <div className="booking-card">

                            <form onSubmit={handleBooking} className="booking-form">
                                <div className="form-group">
                                    <label className="form-label">Check In</label>
                                    <input
                                        type="date"
                                        name="check_in_date"
                                        value={bookingData.check_in_date}
                                        onChange={handleBookingChange}
                                        className="form-input"
                                        min={getTodayDate()}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Check Out</label>
                                    <input
                                        type="date"
                                        name="check_out_date"
                                        value={bookingData.check_out_date}
                                        onChange={handleBookingChange}
                                        className="form-input"
                                        min={bookingData.check_in_date || getTomorrowDate()}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Guests</label>
                                    <input
                                        type="number"
                                        name="num_guests"
                                        value={bookingData.num_guests}
                                        onChange={handleBookingChange}
                                        className="form-input"
                                        min="1"
                                        max={property.max_guests}
                                        required
                                    />
                                </div>

                                {nights > 0 && (
                                    <div className="booking-summary">
                                        <div className="summary-row">
                                            <span>{formatPrice(property.price_per_night)} × {nights} nights</span>
                                            <span>{formatPrice(calculateTotalPrice())}</span>
                                        </div>
                                        <div className="summary-total">
                                            <span>Total</span>
                                            <span>{formatPrice(calculateTotalPrice())}</span>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-full"
                                    disabled={bookingLoading || !isAuthenticated}
                                >
                                    {bookingLoading ? 'Booking...' : isAuthenticated ? 'Request to Book' : 'Login to Book'}
                                </button>
                            </form>

                            {!isAuthenticated && (
                                <p className="booking-note">You must be logged in to book this property</p>
                            )}
                        </div>
                    )}

                    {/* Owner Info Card - Only for Owners viewing their own property */}
                    {isAuthenticated && user?.userType === 'owner' && (
                        <div className="owner-info-card">
                            <h3>Your Property</h3>
                            <div className="owner-stats">
                                <div className="owner-stat-item">
                                    <span className="stat-label">Price per Night</span>
                                    <span className="stat-value">{formatPrice(property.price_per_night)}</span>
                                </div>
                                <div className="owner-stat-item">
                                    <span className="stat-label">Status</span>
                                    <span className={`stat-value ${property.is_available ? 'available' : 'unavailable'}`}>
                                        {property.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                            </div>
                            <Link to="/owner/properties" className="btn btn-secondary btn-full">
                                Manage Property
                            </Link>
                            <Link to="/owner/bookings" className="btn btn-outline btn-full">
                                View Booking Requests
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;