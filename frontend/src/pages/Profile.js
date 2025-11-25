import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../redux/hooks';
import { updateUser } from '../redux/slices/authSlice';
import userService from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { countries } from '../utils/countries';
import './Profile.css';

const Profile = () => {
    const dispatch = useDispatch();
    const { user, loading: authLoading } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        city: '',
        state: '',
        country: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                city: user.city || '',
                state: user.state || '',
                country: user.country || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        let value = e.target.value;
        const name = e.target.name;
        
        if (name === 'phone_number') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        
        if (name === 'state') {
            value = value.toUpperCase().slice(0, 2);
        }
        
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await userService.updateProfile(formData);
            
            // Update Redux state with new user data
            dispatch(updateUser(response.user));
            
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    if (!user) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    return (
        <div className="profile-page">
            <div className="container">
                <h1 className="page-title">My Profile</h1>
                
                <div className="profile-card">
                    <ErrorMessage message={error} onClose={() => setError('')} />
                    <SuccessMessage message={success} onClose={() => setSuccess('')} />

                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user?.profilePicture ? (
                                <img 
                                    src={`${process.env.REACT_APP_UPLOADS_URL}${user.profilePicture}`}
                                    alt={user?.name}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user?.name?.charAt(0).toUpperCase() || '👤'}
                                </div>
                            )}
                        </div>
                        <div className="profile-info">
                            <h2>{user?.name}</h2>
                            <p className="user-type-badge">
                                {user?.userType === 'traveler' ? '✈️ Traveler' : '🏠 Property Owner'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <h3>Personal Information</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                    disabled
                                />
                                <small className="form-helper">Email cannot be changed</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="1234567890 (10 digits)"
                                maxLength="10"
                            />
                        </div>

                        <h3>Location</h3>

                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="San Francisco"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">State (2-letter code)</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="CA"
                                    maxLength="2"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Country</label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;