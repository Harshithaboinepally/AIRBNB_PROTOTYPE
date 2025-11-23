import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { useAuth } from '../redux/hooks';
import ErrorMessage from '../components/common/ErrorMessage';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { isAuthenticated, loading, error, user } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [validationErrors, setValidationErrors] = useState({});

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.userType === 'traveler') {
                navigate('/dashboard');
            } else if (user.userType === 'owner') {
                navigate('/owner/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const validateForm = () => {
        const errors = {};
        
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Dispatch login action
        dispatch(loginUser(formData));
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Login to your Airbnb account</p>

                <ErrorMessage message={error} onClose={() => dispatch(clearError())} />

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
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

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-input ${validationErrors.password ? 'error' : ''}`}
                            placeholder="Enter your password"
                            required
                        />
                        {validationErrors.password && (
                            <span className="error-text">{validationErrors.password}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;