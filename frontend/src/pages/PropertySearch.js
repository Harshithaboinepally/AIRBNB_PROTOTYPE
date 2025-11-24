import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
    searchProperties, 
    setSearchFilters, 
    clearSearchFilters,
    clearError 
} from '../redux/slices/propertySlice';
import { useProperties } from '../redux/hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatPrice } from '../utils/priceUtils';
import './PropertySearch.css';

const PropertySearch = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    // Redux state using custom hook
    const { 
        items: properties, 
        searchLoading: loading, 
        error
    } = useProperties();
    
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
        // Initialize with URL params or fetch all properties
        const initialFilters = {
            location: searchParams.get('location') || '',
            startDate: searchParams.get('startDate') || '',
            endDate: searchParams.get('endDate') || '',
            guests: searchParams.get('guests') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            propertyType: searchParams.get('propertyType') || ''
        };
        
        setFilters(initialFilters);
        dispatch(setSearchFilters(initialFilters));
        dispatch(searchProperties(initialFilters));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount, searchParams intentionally excluded

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
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
        
        // Update Redux and search
        dispatch(setSearchFilters(filters));
        dispatch(searchProperties(filters));
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            location: '',
            startDate: '',
            endDate: '',
            guests: '',
            minPrice: '',
            maxPrice: '',
            propertyType: ''
        };
        setFilters(emptyFilters);
        setSearchParams({});
        dispatch(clearSearchFilters());
        dispatch(searchProperties());
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
                                    placeholder="City, State, Country..."
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
                                    min={new Date().toISOString().split('T')[0]}
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
                                    min={filters.startDate || new Date().toISOString().split('T')[0]}
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
                                    placeholder="Number of guests"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="form-group">
                                <label className="form-label">Property Type</label>
                                <select
                                    name="propertyType"
                                    value={filters.propertyType}
                                    onChange={handleFilterChange}
                                    className="form-select"
                                >
                                    <option value="">All Types</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="villa">Villa</option>
                                    <option value="condo">Condo</option>
                                    <option value="cabin">Cabin</option>
                                    <option value="cottage">Cottage</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Min Price (per night)</label>
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
                                <label className="form-label">Max Price (per night)</label>
                                <input
                                    type="number"
                                    name="maxPrice"
                                    value={filters.maxPrice}
                                    onChange={handleFilterChange}
                                    className="form-input"
                                    placeholder="No limit"
                                    min="0"
                                />
                            </div>

                            <div className="form-group search-buttons">
                                <button type="submit" className="btn btn-primary">
                                    🔍 Search
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleClearFilters} 
                                    className="btn btn-secondary"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />

                {/* Results */}
                <div className="search-results">
                    <h2 className="results-title">
                        {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Found
                    </h2>

                    {properties.length === 0 ? (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <h3>No properties found</h3>
                            <p>No properties match your search criteria.</p>
                            <p>Try adjusting your filters or search in a different location.</p>
                            <button onClick={handleClearFilters} className="btn btn-primary">
                                Clear Filters
                            </button>
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
                <img 
                    src={imageUrl} 
                    alt={property.property_name}
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                />
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