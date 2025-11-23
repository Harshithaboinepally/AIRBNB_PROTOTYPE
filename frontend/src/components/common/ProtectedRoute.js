import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredUserType }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

    if (loading) {
        return <LoadingSpinner message="Checking authentication..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check user type if specified
    if (requiredUserType && user?.userType !== requiredUserType) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;