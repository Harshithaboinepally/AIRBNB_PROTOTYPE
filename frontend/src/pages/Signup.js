import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';
import { countries } from '../utils/countries';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        userType: 'traveler',
        phone_number: '',
        city: '',
        state: '',
        country: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // ADD VALIDATION FUNCTIONS 
    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);

        if (!minLength) {
            return 'Password must be at least 8 characters';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumber) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character (@$!%*?&)';
        }
        return null;
    };

    const validatePhoneNumber = (phone) => {
        if (!phone) return null; // Optional field
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            return 'Phone number must be exactly 10 digits';
        }
        return null;
    };

    const handleChange = (e) => {
        let value = e.target.value;
        
        // Format phone number - keep only digits
        if (e.target.name === 'phone_number') {
            value = value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
        }
        
        // Format state - uppercase, max 2 characters
        if (e.target.name === 'state') {
            value = value.toUpperCase().slice(0, 2);
        }
        
        setFormData({
            ...formData,
            [e.target.name]: value
        });
        setError('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Validate phone number if provided
        if (formData.phone_number) {
            const phoneError = validatePhoneNumber(formData.phone_number);
            if (phoneError) {
                setError(phoneError);
                return;
            }
        }

        setLoading(true);

        try {
            // Remove confirmPassword before sending to backend
            const { confirmPassword, ...signupData } = formData;
            
            const response = await signup(signupData);
            
            // Redirect based on user type
            if (response.user.userType === 'traveler') {
                navigate('/dashboard');
            } else {
                navigate('/owner/dashboard');
            }
        } catch (err) {
            console.error('Signup error:', err);
            // Display backend validation errors
            if (err.response?.data?.details) {
                const errorMessages = err.response.data.details.map(d => d.msg).join(', ');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || err.response?.data?.error || 'Signup failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    // Password strength indicator
    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        if (strength <= 2) return { strength: 'Weak', color: '#ff4444' };
        if (strength <= 3) return { strength: 'Medium', color: '#ffaa00' };
        return { strength: 'Strong', color: '#00cc66' };
    };

    const passwordStrength = getPasswordStrength();
    return (
        <div className="auth-container">
            <div className="auth-card auth-card-large">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Airbnb today</p>

                <ErrorMessage message={error} onClose={() => setError('')} />

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* User Type Selection */}
                    <div className="form-group">
                        <label className="form-label">I want to</label>
                        <div className="user-type-selector">
                            <label className={`user-type-option ${formData.userType === 'traveler' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="userType"
                                    value="traveler"
                                    checked={formData.userType === 'traveler'}
                                    onChange={handleChange}
                                />
                                <div className="user-type-content">
                                    <span className="user-type-icon">✈️</span>
                                    <span className="user-type-text">Book Places</span>
                                </div>
                            </label>
                            <label className={`user-type-option ${formData.userType === 'owner' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="userType"
                                    value="owner"
                                    checked={formData.userType === 'owner'}
                                    onChange={handleChange}
                                />
                                <div className="user-type-content">
                                    <span className="user-type-icon">🏠</span>
                                    <span className="user-type-text">Host Properties</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="John Doe"
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
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>
                    {/* Password */}
<div className="form-row">
    <div className="form-group">
        <label className="form-label">Password *</label>
        <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="Min 8 chars, A-Z, a-z, 0-9, @$!%*?&"
            required
        />
        {formData.password && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: passwordStrength.color, fontWeight: 'bold' }}>
                    {passwordStrength.strength}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#717171', marginTop: '0.25rem' }}>
                    Must contain: uppercase, lowercase, number, special char (@$!%*?&)
                </div>
            </div>
        )}
    </div>

    <div className="form-group">
        <label className="form-label">Confirm Password *</label>
        <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="Confirm password"
            required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ff4444' }}>
                Passwords do not match
            </div>
        )}
    </div>
</div>

                    {/* Optional Info */}
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
    {formData.phone_number && formData.phone_number.length > 0 && formData.phone_number.length !== 10 && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ff4444' }}>
            Must be exactly 10 digits
        </div>
    )}
</div>
                    <div>
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

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;