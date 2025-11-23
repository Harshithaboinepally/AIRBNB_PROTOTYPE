import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

// Import reducers
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import bookingReducer from './slices/bookingSlice';
import favoriteReducer from './slices/favoriteSlice';
import { enableMapSet } from "immer";

enableMapSet();
// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  properties: propertyReducer,
  bookings: bookingReducer,
  favorites: favoriteReducer,
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['favorites/toggleFavoriteLocally'],
        // Ignore these paths in the state
        ignoredPaths: ['favorites.favoriteIds'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export root reducer for potential use
export { rootReducer };

// Infer types for TypeScript (if needed in future)
//export type RootState = ReturnType<typeof store.getState>;
//export type AppDispatch = typeof store.dispatch;