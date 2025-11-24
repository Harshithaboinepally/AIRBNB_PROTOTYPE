import { useDispatch, useSelector } from 'react-redux';

// Custom hooks for typed Redux usage
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Auth selectors
export const useAuth = () => {
  return useAppSelector((state) => ({
    user: state.auth.user,
    token: state.auth.token,
    isAuthenticated: state.auth.isAuthenticated,
    loading: state.auth.loading,
    error: state.auth.error,
    signupSuccess: state.auth.signupSuccess,
  }));
};

// Property selectors
export const useProperties = () => {
  return useAppSelector((state) => ({
    items: state.properties.items,
    ownerProperties: state.properties.ownerProperties,
    selectedProperty: state.properties.selectedProperty,
    searchFilters: state.properties.searchFilters,
    loading: state.properties.loading,
    searchLoading: state.properties.searchLoading,
    detailsLoading: state.properties.detailsLoading,
    error: state.properties.error,
    createSuccess: state.properties.createSuccess,
    updateSuccess: state.properties.updateSuccess,
    deleteSuccess: state.properties.deleteSuccess,
  }));
};

// Booking selectors
export const useBookings = () => {
  return useAppSelector((state) => ({
    items: state.bookings.items,
    ownerBookings: state.bookings.ownerBookings,
    selectedBooking: state.bookings.selectedBooking,
    activeTab: state.bookings.activeTab,
    statistics: state.bookings.statistics,
    loading: state.bookings.loading,
    detailsLoading: state.bookings.detailsLoading,
    actionLoading: state.bookings.actionLoading,
    error: state.bookings.error,
    createSuccess: state.bookings.createSuccess,
    cancelSuccess: state.bookings.cancelSuccess,
    acceptSuccess: state.bookings.acceptSuccess,
    rejectSuccess: state.bookings.rejectSuccess,
  }));
};

// Favorite selectors
export const useFavorites = () => {
  return useAppSelector((state) => ({
    items: state.favorites.items,
    favoriteIds: state.favorites.favoriteIds,
    loading: state.favorites.loading,
    actionLoading: state.favorites.actionLoading,
    error: state.favorites.error,
    addSuccess: state.favorites.addSuccess,
    removeSuccess: state.favorites.removeSuccess,
    totalCount: state.favorites.totalCount,
  }));
};

// Check if property is favorited
export const useIsFavorite = (propertyId) => {
    return useSelector(
        state => state.favorites.favoriteIds.includes(propertyId)
    );
};

// Get user role
export const useUserRole = () => {
  return useAppSelector((state) => state.auth.user?.userType || null);
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};