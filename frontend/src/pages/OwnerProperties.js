import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import propertyService from '../services/propertyService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { formatPrice } from '../utils/priceUtils';
import './OwnerProperties.css';

const OwnerProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await propertyService.getOwnerProperties();
            setProperties(response.properties);
            console.log(response.properties)
        } catch (err) {
            console.error('Load properties error:', err);
            setError('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProperty = async (propertyId, propertyName) => {
        if (!window.confirm(`Are you sure you want to delete "${propertyName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await propertyService.deleteProperty(propertyId);
            setSuccess('Property deleted successfully');
            loadProperties();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Delete property error:', err);
            setError(err.response?.data?.message || 'Failed to delete property');
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading properties..." />;
    }

    return (
        <div className="owner-properties-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">My Properties</h1>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        Add New Property
                    </button>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                {properties.length === 0 ? (
                    <div className="empty-properties">
                        <div className="empty-icon">🏠</div>
                        <h3>No properties yet</h3>
                        <p>Start by adding your first property to get bookings!</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                        >
                            Add Your First Property
                        </button>
                    </div>
                ) : (
                    <div className="properties-list">
                        {properties.map(property => (
                            <PropertyCard 
                                key={property.property_id} 
                                property={property}
                                onDelete={handleDeleteProperty}
                            />
                        ))}
                    </div>
                )}

                {/* Add Property Modal */}
                {showAddModal && (
                    <AddPropertyModal 
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            setSuccess('Property added successfully!');
                            loadProperties();
                            setTimeout(() => setSuccess(''), 3000);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// Property Card Component
const PropertyCard = ({ property, onDelete }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const imageUrl = property.primary_image 
        ? `${process.env.REACT_APP_UPLOADS_URL}${property.primary_image}`
        : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <>
            <div className="owner-property-card">
                <div className="property-image-section">
                    <img src={imageUrl} alt={property.property_name} onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }} />
                    <div className={`availability-badge ${property.is_available ? 'available' : 'unavailable'}`}>
                        {property.is_available ? 'Available' : 'Unavailable'}
                    </div>
                </div>

                <div className="property-details-section">
                    <div className="property-header">
                        <div>
                            <h3>{property.property_name}</h3>
                            <p className="property-location">📍 {property.city}, {property.country}</p>
                        </div>
                        <span className="property-type-badge">{property.property_type}</span>
                    </div>

                    <div className="property-stats">
                        <div className="stat">
                            <span className="stat-label">Bedrooms</span>
                            <span className="stat-value">{property.bedrooms}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Bathrooms</span>
                            <span className="stat-value">{property.bathrooms}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Max Guests</span>
                            <span className="stat-value">{property.max_guests}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Price/Night</span>
                            <span className="stat-value">{formatPrice(property.price_per_night)}</span>
                        </div>
                    </div>

                    {property.description && (
                        <p className="property-description">{property.description}</p>
                    )}

                    {property.amenities && property.amenities.length > 0 && (
                        <div className="property-amenities">
                            {property.amenities.slice(0, 3).map((amenity, index) => (
                                <span key={index} className="amenity-tag">✓ {amenity}</span>
                            ))}
                            {property.amenities.length > 3 && (
                                <span className="amenity-tag">+{property.amenities.length - 3} more</span>
                            )}
                        </div>
                    )}

                    {property.pending_bookings > 0 && (
                        <div className="pending-alert">
                             {property.pending_bookings} pending booking request(s)
                        </div>
                    )}

                    <div className="property-actions">
                        <Link 
                            to={`/properties/${property.property_id}`}
                            className="btn btn-secondary"
                        >
                             View
                        </Link>
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-secondary"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => setShowImageModal(true)}
                            className="btn btn-secondary"
                        >
                            Images
                        </button>
                        <button 
                            onClick={() => onDelete(property.property_id, property.property_name)}
                            className="btn btn-danger"
                        >
                             Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditPropertyModal 
                    property={property}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* Image Upload Modal */}
            {showImageModal && (
                <ImageUploadModal 
                    propertyId={property.property_id}
                    propertyName={property.property_name}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </>
    );
};

// Add Property Modal Component
const AddPropertyModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        property_name: '',
        property_type: 'house',
        description: '',
        location: '',
        city: '',
        state: '',
        country: '',
        price_per_night: '',
        bedrooms: '',
        bathrooms: '',
        max_guests: '',
        amenities: []
    });
    const [amenityInput, setAmenityInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddAmenity = () => {
        if (amenityInput.trim()) {
            setFormData({
                ...formData,
                amenities: [...formData.amenities, amenityInput.trim()]
            });
            setAmenityInput('');
        }
    };

    const handleRemoveAmenity = (index) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await propertyService.createProperty(formData);
            onSuccess();
        } catch (err) {
            console.error('Create property error:', err);
            setError(err.response?.data?.message || 'Failed to create property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Property</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />

                <form onSubmit={handleSubmit} className="property-form">
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label">Property Name *</label>
                            <input
                                type="text"
                                name="property_name"
                                value={formData.property_name}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Property Type *</label>
                            <select
                                name="property_type"
                                value={formData.property_type}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="villa">Villa</option>
                                <option value="cabin">Cabin</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price per Night ($) *</label>
                            <input
                                type="number"
                                name="price_per_night"
                                value={formData.price_per_night}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="3"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Street Address *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">State (2 letters)</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="form-input"
                                maxLength="2"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Country *</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bedrooms *</label>
                            <input
                                type="number"
                                name="bedrooms"
                                value={formData.bedrooms}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bathrooms *</label>
                            <input
                                type="number"
                                name="bathrooms"
                                value={formData.bathrooms}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Max Guests *</label>
                            <input
                                type="number"
                                name="max_guests"
                                value={formData.max_guests}
                                onChange={handleChange}
                                className="form-input"
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Amenities</label>
                            <div className="amenity-input-group">
                                <input
                                    type="text"
                                    value={amenityInput}
                                    onChange={(e) => setAmenityInput(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g., WiFi, Pool, Parking"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddAmenity();
                                        }
                                    }}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddAmenity}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="amenities-list">
                                {formData.amenities.map((amenity, index) => (
                                    <span key={index} className="amenity-chip">
                                        {amenity}
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveAmenity(index)}
                                            className="amenity-remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Creating...' : 'Create Property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Property Modal Component (similar structure to Add)
const EditPropertyModal = ({ property, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        property_name: property.property_name,
        property_type: property.property_type,
        description: property.description || '',
        location: property.location,
        city: property.city,
        state: property.state || '',
        country: property.country,
        price_per_night: property.price_per_night,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        max_guests: property.max_guests,
        amenities: property.amenities || [],
        is_available: property.is_available
    });
    const [amenityInput, setAmenityInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleAddAmenity = () => {
        if (amenityInput.trim()) {
            setFormData({
                ...formData,
                amenities: [...formData.amenities, amenityInput.trim()]
            });
            setAmenityInput('');
        }
    };

    const handleRemoveAmenity = (index) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await propertyService.updateProperty(property.property_id, formData);
            onSuccess();
        } catch (err) {
            console.error('Update property error:', err);
            setError(err.response?.data?.message || 'Failed to update property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Property</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />

                <form onSubmit={handleSubmit} className="property-form">
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label">Property Name *</label>
                            <input
                                type="text"
                                name="property_name"
                                value={formData.property_name}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Property Type *</label>
                            <select
                                name="property_type"
                                value={formData.property_type}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="villa">Villa</option>
                                <option value="cabin">Cabin</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price per Night ($) *</label>
                            <input
                                type="number"
                                name="price_per_night"
                                value={formData.price_per_night}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="3"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Street Address *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">State (2 letters)</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="form-input"
                                maxLength="2"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Country *</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bedrooms *</label>
                            <input
                                type="number"
                                name="bedrooms"
                                value={formData.bedrooms}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Bathrooms *</label>
                            <input
                                type="number"
                                name="bathrooms"
                                value={formData.bathrooms}
                                onChange={handleChange}
                                className="form-input"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Max Guests *</label>
                            <input
                                type="number"
                                name="max_guests"
                                value={formData.max_guests}
                                onChange={handleChange}
                                className="form-input"
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_available"
                                    checked={formData.is_available}
                                    onChange={handleChange}
                                />
                                <span>Property is available for booking</span>
                            </label>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Amenities</label>
                            <div className="amenity-input-group">
                                <input
                                    type="text"
                                    value={amenityInput}
                                    onChange={(e) => setAmenityInput(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g., WiFi, Pool, Parking"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddAmenity();
                                        }
                                    }}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddAmenity}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="amenities-list">
                                {formData.amenities.map((amenity, index) => (
                                    <span key={index} className="amenity-chip">
                                        {amenity}
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveAmenity(index)}
                                            className="amenity-remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Updating...' : 'Update Property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Image Upload Modal Component
const ImageUploadModal = ({ propertyId, propertyName, onClose }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return false;
            }
            if (file.size > 5242880) { // 5MB
                setError('Images must be less than 5MB');
                return false;
            }
            return true;
        });

        setSelectedFiles(validFiles);
        setError('');
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image');
            return;
        }

        setUploading(true);
        setError('');

        try {
            await propertyService.uploadPropertyImages(propertyId, selectedFiles);
            setSuccess('Images uploaded successfully!');
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 2000);
        } catch (err) {
            console.error('Upload images error:', err);
            setError(err.response?.data?.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload Images - {propertyName}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                <div className="image-upload-section">
                    <label className="file-upload-label">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <div className="file-upload-button">
                            📷 Choose Images (Max 10)
                        </div>
                    </label>

                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            <h4>Selected Images ({selectedFiles.length}):</h4>
                            <ul>
                                {selectedFiles.map((file, index) => (
                                    <li key={index}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleUpload}
                        disabled={uploading || selectedFiles.length === 0}
                        className="btn btn-primary"
                    >
                        {uploading ? 'Uploading...' : 'Upload Images'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerProperties;