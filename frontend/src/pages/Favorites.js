import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import favoriteService from '../services/favoriteService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import './Favorites.css';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await favoriteService.getFavorites();
            setFavorites(response.favorites);
        } catch (err) {
            console.error('Load favorites error:', err);
            setError('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (propertyId) => {
        try {
            await favoriteService.removeFavorite(propertyId);
            setSuccess('Removed from favorites');
            loadFavorites();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Remove favorite error:', err);
            setError('Failed to remove from favorites');
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading favorites..." />;
    }

    return (
        <div className="favorites-page">
            <div className="container">
                <h1 className="page-title">My Favorites ❤️</h1>

                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                {favorites.length === 0 ? (
                    <div className="empty-favorites">
                        <div className="empty-icon">💔</div>
                        <h3>No favorites yet</h3>
                        <p>Start exploring and save your favorite properties!</p>
                        <Link to="/properties" className="btn btn-primary">
                            Explore Properties
                        </Link>
                    </div>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map(property => (
                            <FavoriteCard 
                                key={property.property_id} 
                                property={property}
                                onRemove={handleRemoveFavorite}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Favorite Card Component
const FavoriteCard = ({ property, onRemove }) => {
    const imageUrl = property.primary_image 
        ? `${process.env.REACT_APP_API_URL}${property.primary_image}`
        : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <div className="favorite-card">
            <Link to={`/properties/${property.property_id}`} className="favorite-link">
                <div className="favorite-image">
                    <img 
                        src={imageUrl} 
                        alt={property.property_name}
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                    />
                    <div className="property-type-badge">{property.property_type}</div>
                </div>
                <div className="favorite-info">
                    <h3 className="property-name">{property.property_name}</h3>
                    <p className="property-location">
                        📍 {property.city}, {property.country}
                    </p>
                    <p className="property-details">
                        {property.bedrooms} bed · {property.bathrooms} bath · {property.max_guests} guests
                    </p>
                    <div className="property-price">
                        <span className="price-amount">{formatPrice(property.price_per_night)}</span>
                        <span className="price-period"> / night</span>
                    </div>
                </div>
            </Link>
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    onRemove(property.property_id);
                }}
                className="remove-favorite-btn"
                title="Remove from favorites"
            >
                ❤️ Remove
            </button>
        </div>
    );
};

export default Favorites;