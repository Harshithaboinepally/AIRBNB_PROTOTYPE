import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import favoriteService from '../../services/favoriteService';

// ==================== ASYNC THUNKS ====================

// Get Favorites
export const getFavorites = createAsyncThunk(
  'favorites/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await favoriteService.getFavorites();
      return response.favorites;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch favorites'
      );
    }
  }
);

// Add to Favorites
export const addToFavorites = createAsyncThunk(
  'favorites/add',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await favoriteService.addFavorite(propertyId);
      return { propertyId, data: response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add favorite'
      );
    }
  }
);

// Remove from Favorites
export const removeFromFavorites = createAsyncThunk(
  'favorites/remove',
  async (propertyId, { rejectWithValue }) => {
    try {
      await favoriteService.removeFavorite(propertyId);
      return propertyId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove favorite'
      );
    }
  }
);

// Check if Favorite
export const checkIsFavorite = createAsyncThunk(
  'favorites/check',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await favoriteService.checkFavorite(propertyId);
      return { propertyId, isFavorite: response.isFavorite };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check favorite'
      );
    }
  }
);

// Batch check
export const batchCheckFavorites = createAsyncThunk(
  'favorites/batchCheck',
  async (propertyIds, { rejectWithValue }) => {
    try {
      const checks = await Promise.all(
        propertyIds.map(id => favoriteService.checkFavorite(id))
      );

      const favoriteMap = {};
      propertyIds.forEach((id, idx) => {
        favoriteMap[id] = checks[idx].isFavorite;
      });

      return favoriteMap;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check favorites'
      );
    }
  }
);

// ==================== SLICE ====================

const initialState = {
  items: [],
  favoriteIds: [],   // <-- FIX: changed from new Set()
  loading: false,
  actionLoading: false,
  error: null,
  addSuccess: false,
  removeSuccess: false,
  lastFetch: null,
  totalCount: 0,
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    clearSuccessMessages: (state) => {
      state.addSuccess = false;
      state.removeSuccess = false;
    },

    // Toggle local favorite state
    toggleFavoriteLocally: (state, action) => {
      const propertyId = action.payload;

      if (state.favoriteIds.includes(propertyId)) {
        state.favoriteIds = state.favoriteIds.filter(id => id !== propertyId);
        state.items = state.items.filter(item => item.property_id !== propertyId);
        state.totalCount = Math.max(0, state.totalCount - 1);
      } else {
        state.favoriteIds.push(propertyId);
        state.totalCount += 1;
      }
    },

    addFavoriteIdLocally: (state, action) => {
      const propertyId = action.payload;
      if (!state.favoriteIds.includes(propertyId)) {
        state.favoriteIds.push(propertyId);
        state.totalCount += 1;
      }
    },

    removeFavoriteIdLocally: (state, action) => {
      const propertyId = action.payload;
      state.favoriteIds = state.favoriteIds.filter(id => id !== propertyId);
      state.items = state.items.filter(item => item.property_id !== propertyId);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },

    // Synchronous check
    isFavorited: (state, action) => {
      return state.favoriteIds.includes(action.payload);
    },

    clearAllFavoriteData: (state) => {
      state.items = [];
      state.favoriteIds = [];
      state.totalCount = 0;
      state.lastFetch = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ==================== GET FAVORITES ====================
      .addCase(getFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.favoriteIds = action.payload.map(item => item.property_id);
        state.totalCount = action.payload.length;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(getFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
        state.favoriteIds = [];
      })

      // ==================== ADD FAVORITE ====================
      .addCase(addToFavorites.pending, (state) => {
        state.actionLoading = true;
        state.addSuccess = false;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.addSuccess = true;

        const propertyId = action.payload.propertyId;
        if (!state.favoriteIds.includes(propertyId)) {
          state.favoriteIds.push(propertyId);
          state.totalCount += 1;
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ==================== REMOVE FAVORITE ====================
      .addCase(removeFromFavorites.pending, (state) => {
        state.actionLoading = true;
        state.removeSuccess = false;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.removeSuccess = true;

        const propertyId = action.payload;

        state.favoriteIds = state.favoriteIds.filter(id => id !== propertyId);
        state.items = state.items.filter(item => item.property_id !== propertyId);
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ==================== CHECK FAVORITE ====================
      .addCase(checkIsFavorite.fulfilled, (state, action) => {
        const { propertyId, isFavorite } = action.payload;
        if (isFavorite) {
          if (!state.favoriteIds.includes(propertyId)) {
            state.favoriteIds.push(propertyId);
          }
        } else {
          state.favoriteIds = state.favoriteIds.filter(id => id !== propertyId);
        }
      })

      // ==================== BATCH CHECK FAVORITES ====================
      .addCase(batchCheckFavorites.fulfilled, (state, action) => {
        Object.entries(action.payload).forEach(([propertyId, isFavorite]) => {
          const id = parseInt(propertyId);
          if (isFavorite) {
            if (!state.favoriteIds.includes(id)) {
              state.favoriteIds.push(id);
            }
          } else {
            state.favoriteIds = state.favoriteIds.filter(f => f !== id);
          }
        });
      });
  },
});

// Selectors
export const selectIsFavorite = (state, propertyId) =>
  state.favorites.favoriteIds.includes(propertyId);

export const selectFavoriteCount = (state) =>
  state.favorites.totalCount;

export const {
  clearError,
  clearSuccessMessages,
  toggleFavoriteLocally,
  addFavoriteIdLocally,
  removeFavoriteIdLocally,
  isFavorited,
  clearAllFavoriteData,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;
