import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signupUser, clearError, clearSignupSuccess } from '../redux/slices/authSlice';
import { useAuth } from '../redux/hooks';
import ErrorMessage from '../components/common/ErrorMessage';
import SuccessMessage from '../components/common/SuccessMessage';
import { countries } from '../utils/countries';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get state from Redux using custom hook
    const { loading, error, signupSuccess } = useAuth();
    
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
    const [validationErrors, setValidationErrors] = useState({});

    // Redirect on successful signup
    useEffect(() => {
        if (signupSuccess) {
            // Show success message briefly before redirect
            setTimeout(() => {
                dispatch(clearSignupSuccess());
                navigate('/login');
            }, 1500);
        }
    }, [signupSuccess, navigate, dispatch]);

    // Clear error on unmount
    useEffect(() => {
        return () => {
            dispatch(clearError());
            dispatch(clearSignupSuccess());
        };
    }, [dispatch]);

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
        if (!phone) return null;
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            return 'Phone number must be exactly 10 digits';
        }
        return null;
    };

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
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: null
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name) {
            errors.name = 'Name is required';
        }
        
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            errors.password = passwordError;
        }
        
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (formData.phone_number) {
            const phoneError = validatePhoneNumber(formData.phone_number);
            if (phoneError) {
                errors.phone_number = phoneError;
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!validateForm()) {
            return;
        }

        // Remove confirmPassword before sending
        const { confirmPassword, ...signupData } = formData;
        
        dispatch(signupUser(signupData));
    };

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

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
                {signupSuccess && (
                    <SuccessMessage 
                        message="Account created successfully! Redirecting to login..." 
                        onClose={() => dispatch(clearSignupSuccess())} 
                    />
                )}

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
                                className={`form-input ${validationErrors.name ? 'error' : ''}`}
                                placeholder="John Doe"
                                required
                            />
                            {validationErrors.name && (
                                <span className="error-text">{validationErrors.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${validationErrors.email ? 'error' : ''}`}
                                placeholder="your@email.com"
                                required
                            />
                            {validationErrors.email && (
                                <span className="error-text">{validationErrors.email}</span>
                            )}
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
                                className={`form-input ${validationErrors.password ? 'error' : ''}`}
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
                            {validationErrors.password && (
                                <span className="error-text">{validationErrors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                                placeholder="Confirm password"
                                required
                            />
                            {validationErrors.confirmPassword && (
                                <span className="error-text">{validationErrors.confirmPassword}</span>
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
                            className={`form-input ${validationErrors.phone_number ? 'error' : ''}`}
                            placeholder="1234567890 (10 digits)"
                            maxLength="10"
                        />
                        {validationErrors.phone_number && (
                            <span className="error-text">{validationErrors.phone_number}</span>
                        )}
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