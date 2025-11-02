import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import propertyService from '../services/propertyService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatPrice } from '../utils/priceUtils';
import './PropertySearch.css';

const PropertySearch = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [filters, setFilters] = useState({
        location: searchParams.get('location') || '',
        startDate: searchParams.get('startDate') || '',
        endDate: searchParams.get('endDate') || '',
        guests: searchParams.get('guests') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        propertyType: searchParams.get('propertyType') || ''
    });

    useEffect(() => {
        searchProperties();
    }, []);

    const searchProperties = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Build query params (remove empty values)
            const params = {};
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params[key] = filters[key];
                }
            });

            const response = await propertyService.searchProperties(params);
            setProperties(response.properties);
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to load properties. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Update URL params
        const params = {};
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params[key] = filters[key];
            }
        });
        setSearchParams(params);
        
        searchProperties();
    };

    const clearFilters = () => {
        setFilters({
            location: '',
            startDate: '',
            endDate: '',
            guests: '',
            minPrice: '',
            maxPrice: '',
            propertyType: ''
        });
        setSearchParams({});
        searchProperties();
    };

    if (loading) {
        return <LoadingSpinner message="Searching properties..." />;
    }

    return (
        <div className="property-search-page">
            <div className="container">
                <h1 className="page-title">Find Your Perfect Stay</h1>

                {/* Search Filters */}
                <div className="search-filters-card">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="filter-row">
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={filters.location}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                    placeholder="City, State, or Country"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Check In</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Check Out</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Guests</label>
                                <input
                                    type="number"
                                    name="guests"
                                    value={filters.guests}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                    placeholder="2"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="form-group">
                                <label className="form-label">Min Price</label>
                                <input
                                    type="number"
                                    name="minPrice"
                                    value={filters.minPrice}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                    placeholder="$0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Max Price</label>
                                <input
                                    type="number"
                                    name="maxPrice"
                                    value={filters.maxPrice}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                    placeholder="$1000"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Property Type</label>
                                <select
                                    name="propertyType"
                                    value={filters.propertyType}
                                    onChange={handleFilterChange}
                                    className="form-select"
                                >
                                    <option value="">All Types</option>
                                    <option value="house">House</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="condo">Condo</option>
                                    <option value="villa">Villa</option>
                                    <option value="cabin">Cabin</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group search-buttons">
                                <button type="submit" className="btn btn-primary">
                                    Search
                                </button>
                                <button type="button" onClick={clearFilters} className="btn btn-secondary">
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />

                {/* Results */}
                <div className="search-results">
                    <h2 className="results-title">
                        {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Found
                    </h2>

                    {properties.length === 0 ? (
                        <div className="no-results">
                            <p>No properties found matching your criteria.</p>
                            <p>Try adjusting your filters or search in a different location.</p>
                        </div>
                    ) : (
                        <div className="properties-grid">
                            {properties.map(property => (
                                <PropertyCard key={property.property_id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Property Card Component
const PropertyCard = ({ property }) => {
    const imageUrl = property.primary_image 
        ? `${process.env.REACT_APP_API_URL}${property.primary_image}`
        : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <Link to={`/properties/${property.property_id}`} className="property-card">
            <div className="property-image">
                <img src={imageUrl} alt={property.property_name} />
                <div className="property-type-badge">{property.property_type}</div>
            </div>
            <div className="property-info">
                <h3 className="property-name">{property.property_name}</h3>
                <p className="property-location">
                    📍 {property.city}, {property.country}
                </p>
                <p className="property-details">
                    {property.bedrooms} bed · {property.bathrooms} bath · {property.max_guests} guests
                </p>
                <div className="property-footer">
                    <div className="property-price">
                        <span className="price-amount">{formatPrice(property.price_per_night)}</span>
                        <span className="price-period"> / night</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PropertySearch;