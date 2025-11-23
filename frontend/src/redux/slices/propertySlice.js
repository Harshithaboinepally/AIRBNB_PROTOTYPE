import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import propertyService from '../../services/propertyService';

// ==================== ASYNC THUNKS ====================

// Search Properties
export const searchProperties = createAsyncThunk(
  'properties/search',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await propertyService.searchProperties(params);
    return {
  properties: JSON.parse(JSON.stringify(response.properties)),
  filters: JSON.parse(JSON.stringify(params)),
  timestamp: new Date().toISOString()
}; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch properties'
      );
    }
  }
);

// Get Property by ID
export const getPropertyById = createAsyncThunk(
  'properties/getById',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await propertyService.getPropertyById(propertyId);
      const safeProperty = JSON.parse(JSON.stringify(response.property));
       return safeProperty;
      //return response.property;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch property details'
      );
    }
  }
);

// Get Owner Properties
export const getOwnerProperties = createAsyncThunk(
  'properties/getOwnerProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await propertyService.getOwnerProperties();
      return response.properties;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch your properties'
      );
    }
  }
);

// Create Property
export const createProperty = createAsyncThunk(
  'properties/create',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await propertyService.createProperty(propertyData);
      return response.property;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create property'
      );
    }
  }
);

// Update Property
export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ propertyId, propertyData }, { rejectWithValue }) => {
    try {
      const response = await propertyService.updateProperty(propertyId, propertyData);
      return { propertyId, data: response.property };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update property'
      );
    }
  }
);

// Delete Property
export const deleteProperty = createAsyncThunk(
  'properties/delete',
  async (propertyId, { rejectWithValue }) => {
    try {
      await propertyService.deleteProperty(propertyId);
      return propertyId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete property'
      );
    }
  }
);

// Upload Property Images
export const uploadPropertyImages = createAsyncThunk(
  'properties/uploadImages',
  async ({ propertyId, files }, { rejectWithValue }) => {
    try {
      const response = await propertyService.uploadPropertyImages(propertyId, files);
      return { propertyId, images: response.images };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to upload images'
      );
    }
  }
);

// ==================== SLICE ====================

const initialState = {
  // Property listings from search
  items: [],
  
  // Owner's properties
  ownerProperties: [],
  
  // Currently selected/viewed property
  selectedProperty: null,
  
  // Search filters applied
  searchFilters: {
    location: '',
    startDate: '',
    endDate: '',
    guests: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
  },
  
  // Last search metadata
  lastSearch: {
    timestamp: null,
    filters: null,
    resultsCount: 0,
  },
  
  // Loading states
  loading: false,
  searchLoading: false,
  detailsLoading: false,
  
  // Error handling
  error: null,
  
  // Success flags
  createSuccess: false,
  updateSuccess: false,
  deleteSuccess: false,
  uploadSuccess: false,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    // Set search filters
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    
    // Clear all filters
    clearSearchFilters: (state) => {
      state.searchFilters = {
        location: '',
        startDate: '',
        endDate: '',
        guests: '',
        minPrice: '',
        maxPrice: '',
        propertyType: '',
      };
    },
    
    // Clear selected property
    clearSelectedProperty: (state) => {
      state.selectedProperty = null;
    },
    
    // Clear all success messages
    clearSuccessMessages: (state) => {
      state.createSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
      state.uploadSuccess = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Update property in owner list (optimistic update)
    updatePropertyLocally: (state, action) => {
      const { propertyId, updates } = action.payload;
      const index = state.ownerProperties.findIndex(
        p => p.property_id === propertyId
      );
      if (index !== -1) {
        state.ownerProperties[index] = {
          ...state.ownerProperties[index],
          ...updates
        };
      }
    },
    
    // Clear all property data (for logout)
    clearAllPropertyData: (state) => {
      state.items = [];
      state.ownerProperties = [];
      state.selectedProperty = null;
      state.searchFilters = initialState.searchFilters;
      state.lastSearch = initialState.lastSearch;
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== SEARCH PROPERTIES ==========
      .addCase(searchProperties.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.items = action.payload.properties;
        state.lastSearch = {
          timestamp: action.payload.timestamp,
          filters: action.payload.filters,
          resultsCount: action.payload.properties.length,
        };
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
        state.items = [];
      })
      
      // ========== GET PROPERTY BY ID ==========
      .addCase(getPropertyById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(getPropertyById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedProperty = action.payload;
      })
      .addCase(getPropertyById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
        state.selectedProperty = null;
      })
      
      // ========== GET OWNER PROPERTIES ==========
      .addCase(getOwnerProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOwnerProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerProperties = action.payload;
      })
      .addCase(getOwnerProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.ownerProperties = [];
      })
      
      // ========== CREATE PROPERTY ==========
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.ownerProperties.unshift(action.payload); // Add to beginning
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.createSuccess = false;
      })
      
      // ========== UPDATE PROPERTY ==========
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.updateSuccess = true;
        
        const index = state.ownerProperties.findIndex(
          p => p.property_id === action.payload.propertyId
        );
        if (index !== -1) {
          state.ownerProperties[index] = action.payload.data;
        }
        
        // Update selected property if it's the same one
        if (state.selectedProperty?.property_id === action.payload.propertyId) {
          state.selectedProperty = action.payload.data;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // ========== DELETE PROPERTY ==========
      .addCase(deleteProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteSuccess = true;
        state.ownerProperties = state.ownerProperties.filter(
          p => p.property_id !== action.payload
        );
        
        // Clear selected property if it was deleted
        if (state.selectedProperty?.property_id === action.payload) {
          state.selectedProperty = null;
        }
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.deleteSuccess = false;
      })
      
      // ========== UPLOAD IMAGES ==========
      .addCase(uploadPropertyImages.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadSuccess = false;
      })
      .addCase(uploadPropertyImages.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadSuccess = true;
        
        // Update property with new images
        const index = state.ownerProperties.findIndex(
          p => p.property_id === action.payload.propertyId
        );
        if (index !== -1) {
          state.ownerProperties[index].images = action.payload.images;
        }
      })
      .addCase(uploadPropertyImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadSuccess = false;
      });
  },
});

export const {
  setSearchFilters,
  clearSearchFilters,
  clearSelectedProperty,
  clearSuccessMessages,
  clearError,
  setPagination,
  updatePropertyLocally,
  clearAllPropertyData,
} = propertySlice.actions;

export default propertySlice.reducer;