import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { countries } from '../utils/countries';
import './Profile.css';

const Profile = () => {
    const { user, checkAuth } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        about_me: '',
        city: '',
        state: '',
        country: '',
        languages: '',
        gender: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await userService.getProfile();
            setProfile(response.user);
            setFormData({
                name: response.user.name || '',
                phone_number: response.user.phone_number || '',
                about_me: response.user.about_me || '',
                city: response.user.city || '',
                state: response.user.state || '',
                country: response.user.country || '',
                languages: response.user.languages || '',
                gender: response.user.gender || ''
            });
        } catch (err) {
            console.error('Load profile error:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        let value = e.target.value;
        
        // Format phone number
        if (e.target.name === 'phone_number') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        
        // Format state
        if (e.target.name === 'state') {
            value = value.toUpperCase().slice(0, 2);
        }
        
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await userService.updateProfile(formData);
            setSuccess('Profile updated successfully!');
            setEditing(false);
            loadProfile();
            checkAuth(); // Update auth context
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5242880) {
            setError('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            await userService.uploadProfilePicture(file);
            setSuccess('Profile picture updated!');
            loadProfile();
            checkAuth(); // Update auth context
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Upload image error:', err);
            setError(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    const profilePictureUrl = profile?.profile_picture 
        ? `${process.env.REACT_APP_API_URL}${profile.profile_picture}`
        : null;

    return (
        <div className="profile-page">
            <div className="container">
                <h1 className="page-title">My Profile</h1>

                <ErrorMessage message={error} onClose={() => setError('')} />
                <SuccessMessage message={success} onClose={() => setSuccess('')} />

                <div className="profile-container">
                    {/* Profile Picture Section */}
                    <div className="profile-sidebar">
                        <div className="profile-picture-section">
                            <div className="profile-picture-wrapper">
                                {profilePictureUrl ? (
                                    <img 
                                        src={profilePictureUrl} 
                                        alt={profile.name}
                                        className="profile-picture"
                                    />
                                ) : (
                                    <div className="profile-picture-placeholder">
                                        {profile?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <label className="upload-picture-btn">
                                {uploading ? 'Uploading...' : 'Change Photo'}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div className="profile-info-sidebar">
                            <h3>{profile?.name}</h3>
                            <p>{profile?.email}</p>
                            <span className="user-type-badge">{profile?.user_type}</span>
                            <p className="member-since">
                                Member since {new Date(profile?.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="profile-form-section">
                        {!editing ? (
                            // View Mode
                            <div className="profile-view">
                                <div className="profile-header">
                                    <h2>Personal Information</h2>
                                    <button 
                                        onClick={() => setEditing(true)}
                                        className="btn btn-secondary"
                                    >
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="profile-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Full Name</span>
                                        <span className="detail-value">{profile?.name || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Email</span>
                                        <span className="detail-value">{profile?.email || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone Number</span>
                                        <span className="detail-value">{profile?.phone_number || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">About Me</span>
                                        <span className="detail-value">{profile?.about_me || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">City</span>
                                        <span className="detail-value">{profile?.city || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">State</span>
                                        <span className="detail-value">{profile?.state || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Country</span>
                                        <span className="detail-value">{profile?.country || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Languages</span>
                                        <span className="detail-value">{profile?.languages || '-'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Gender</span>
                                        <span className="detail-value">
                                            {profile?.gender ? profile.gender.replace('_', ' ') : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Edit Mode
                            <form onSubmit={handleSubmit} className="profile-edit-form">
                                <div className="profile-header">
                                    <h2>Edit Profile</h2>
                                    <div className="form-actions">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setEditing(false);
                                                loadProfile();
                                            }}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                <div className="form-grid">
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
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="1234567890"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">About Me</label>
                                        <textarea
                                            name="about_me"
                                            value={formData.about_me}
                                            onChange={handleChange}
                                            className="form-textarea"
                                            placeholder="Tell us about yourself..."
                                            rows="4"
                                        />
                                    </div>

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

                                    <div className="form-group">
                                        <label className="form-label">State (2 letters)</label>
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

                                    <div className="form-group">
                                        <label className="form-label">Languages</label>
                                        <input
                                            type="text"
                                            name="languages"
                                            value={formData.languages}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="English, Spanish"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="form-select"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;