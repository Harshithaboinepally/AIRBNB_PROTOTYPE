import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser, logoutUser } from './redux/slices/authSlice';
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ChatWidget from './components/ChatWidget/ChatWidget';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PropertySearch from './pages/PropertySearch';
import PropertyDetails from './pages/PropertyDetails';
import TravelerDashboard from './pages/TravelerDashboard';
import Bookings from './pages/Bookings';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerProperties from './pages/OwnerProperties';
import OwnerBookings from './pages/OwnerBookings';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsInitialized(true);
    };

    initAuth();
  }, [dispatch]);

  // Session timeout handler
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dispatch(logoutUser());
        navigate('/login');
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [isAuthenticated, dispatch, navigate]);

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f7f7f7'
      }}>
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/properties" element={<PropertySearch />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />

          {/* Traveler Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredUserType="traveler">
                <TravelerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute requiredUserType="traveler">
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute requiredUserType="traveler">
                <Favorites />
              </ProtectedRoute>
            }
          />

          {/* Owner Routes */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute requiredUserType="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/properties"
            element={
              <ProtectedRoute requiredUserType="owner">
                <OwnerProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/bookings"
            element={
              <ProtectedRoute requiredUserType="owner">
                <OwnerBookings />
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* AI Chat Widget - Only show when authenticated */}
      {isAuthenticated && user && <ChatWidget />}
    </div>
  );
}

export default App;