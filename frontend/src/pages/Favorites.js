import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
    getFavorites, 
    removeFromFavorites, 
    clearError,
    clearSuccessMessages 
} from '../redux/slices/favoriteSlice';
import { useFavorites } from '../redux/hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import './Favorites.css';

const Favorites = () => {
    const dispatch = useDispatch();
    const { 
        items, 
        loading, 
        error, 
        removeSuccess,
        totalCount 
    } = useFavorites();

    useEffect(() => {
        // Load favorites on mount
        dispatch(getFavorites());
    }, [dispatch]);

    useEffect(() => {
        // Clear success message after 3 seconds
        if (removeSuccess) {
            const timer = setTimeout(() => {
                dispatch(clearSuccessMessages());
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [removeSuccess, dispatch]);

    const handleRemoveFavorite = async (propertyId) => {
        if (window.confirm('Remove this property from favorites?')) {
            dispatch(removeFromFavorites(propertyId));
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading favorites..." />;
    }

    return (
        <div className="favorites-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Favorites</h1>
                    {totalCount > 0 && (
                        <span className="count-badge">{totalCount} {totalCount === 1 ? 'property' : 'properties'}</span>
                    )}
                </div>

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
                {removeSuccess && (
                    <SuccessMessage 
                        message="Property removed from favorites" 
                        onClose={() => dispatch(clearSuccessMessages())} 
                    />
                )}

                {items.length === 0 ? (
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
                        {items.map(property => (
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