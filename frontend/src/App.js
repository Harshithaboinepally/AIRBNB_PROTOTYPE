import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading application..." />;
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

          {/* Protected Routes - will add more in next steps */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredUserType="traveler">
              <TravelerDashboard/>
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute requiredUserType="traveler">
              <Bookings/>
            </ProtectedRoute>
          } />

          <Route path="/favorites" element={
            <ProtectedRoute requiredUserType="traveler">
              <Favorites />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute >
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/owner/dashboard" element={
            <ProtectedRoute requiredUserType="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/owner/properties" element={
            <ProtectedRoute requiredUserType="owner">
              <OwnerProperties />
            </ProtectedRoute>
          } />

          <Route path="/owner/bookings" element={
            <ProtectedRoute requiredUserType="owner">
              <OwnerBookings />
            </ProtectedRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {/* AI Chat Widget - Shows on all pages */}
      <ChatWidget />
    </div>
  );
}

export default App;