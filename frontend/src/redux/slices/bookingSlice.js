import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bookingService from '../../services/bookingService';

// ==================== ASYNC THUNKS ====================

// Get Traveler Bookings
export const getTravelerBookings = createAsyncThunk(
  'bookings/getTravelerBookings',
  async (status = null, { rejectWithValue }) => {
    try {
      const response = await bookingService.getTravelerBookings(status);
      return response.bookings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// Get Owner Bookings
export const getOwnerBookings = createAsyncThunk(
  'bookings/getOwnerBookings',
  async (status = null, { rejectWithValue }) => {
    try {
      const response = await bookingService.getOwnerBookings(status);
      return response.bookings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// Get Booking by ID
export const getBookingById = createAsyncThunk(
  'bookings/getById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(bookingId);
      return response.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch booking details'
      );
    }
  }
);

// Create Booking
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create booking'
      );
    }
  }
);

// Cancel Booking (Traveler)
export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      await bookingService.cancelBooking(bookingId, reason);
      return { bookingId, reason };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel booking'
      );
    }
  }
);

// Accept Booking (Owner)
export const acceptBooking = createAsyncThunk(
  'bookings/accept',
  async (bookingId, { rejectWithValue }) => {
    try {
      await bookingService.acceptBooking(bookingId);
      return bookingId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to accept booking'
      );
    }
  }
);

// Reject Booking (Owner)
export const rejectBooking = createAsyncThunk(
  'bookings/reject',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      await bookingService.rejectBooking(bookingId, reason);
      return { bookingId, reason };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject booking'
      );
    }
  }
);

// ==================== SLICE ====================

const initialState = {
  // Traveler bookings
  items: [],
  
  // Owner bookings
  ownerBookings: [],
  
  // Currently selected booking
  selectedBooking: null,
  
  // Active tab/filter
  activeTab: 'all', // 'all', 'pending', 'accepted', 'cancelled'
  
  // Statistics
  statistics: {
    total: 0,
    pending: 0,
    accepted: 0,
    cancelled: 0,
    rejected: 0,
  },
  
  // Loading states
  loading: false,
  detailsLoading: false,
  actionLoading: false, // For accept/cancel/reject actions
  
  // Error handling
  error: null,
  
  // Success flags
  createSuccess: false,
  cancelSuccess: false,
  acceptSuccess: false,
  rejectSuccess: false,
  
  // Last fetch timestamp
  lastFetch: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // Set active tab
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    // Clear selected booking
    clearSelectedBooking: (state) => {
      state.selectedBooking = null;
    },
    
    // Clear all success messages
    clearSuccessMessages: (state) => {
      state.createSuccess = false;
      state.cancelSuccess = false;
      state.acceptSuccess = false;
      state.rejectSuccess = false;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Update booking locally (optimistic update)
    updateBookingLocally: (state, action) => {
      const { bookingId, updates } = action.payload;
      
      // Update in items (traveler bookings)
      const itemIndex = state.items.findIndex(
        b => b.booking_id === bookingId
      );
      if (itemIndex !== -1) {
        state.items[itemIndex] = {
          ...state.items[itemIndex],
          ...updates
        };
      }
      
      // Update in ownerBookings
      const ownerIndex = state.ownerBookings.findIndex(
        b => b.booking_id === bookingId
      );
      if (ownerIndex !== -1) {
        state.ownerBookings[ownerIndex] = {
          ...state.ownerBookings[ownerIndex],
          ...updates
        };
      }
      
      // Update selected booking
      if (state.selectedBooking?.booking_id === bookingId) {
        state.selectedBooking = {
          ...state.selectedBooking,
          ...updates
        };
      }
    },
    
    // Calculate statistics
    calculateStatistics: (state) => {
      const bookings = state.items.length > 0 ? state.items : state.ownerBookings;
      
      state.statistics = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        accepted: bookings.filter(b => b.status === 'ACCEPTED').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        rejected: bookings.filter(b => b.status === 'REJECTED').length,
      };
    },
    
    // Clear all booking data (for logout)
    clearAllBookingData: (state) => {
      state.items = [];
      state.ownerBookings = [];
      state.selectedBooking = null;
      state.activeTab = 'all';
      state.statistics = initialState.statistics;
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== GET TRAVELER BOOKINGS ==========
      .addCase(getTravelerBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTravelerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetch = new Date().toISOString();
        
        // Calculate statistics
        state.statistics = {
          total: action.payload.length,
          pending: action.payload.filter(b => b.status === 'PENDING').length,
          accepted: action.payload.filter(b => b.status === 'ACCEPTED').length,
          cancelled: action.payload.filter(b => b.status === 'CANCELLED').length,
          rejected: action.payload.filter(b => b.status === 'REJECTED').length,
        };
      })
      .addCase(getTravelerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
      })
      
      // ========== GET OWNER BOOKINGS ==========
      .addCase(getOwnerBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOwnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerBookings = action.payload;
        state.lastFetch = new Date().toISOString();
        
        // Calculate statistics
        state.statistics = {
          total: action.payload.length,
          pending: action.payload.filter(b => b.status === 'PENDING').length,
          accepted: action.payload.filter(b => b.status === 'ACCEPTED').length,
          cancelled: action.payload.filter(b => b.status === 'CANCELLED').length,
          rejected: action.payload.filter(b => b.status === 'REJECTED').length,
        };
      })
      .addCase(getOwnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.ownerBookings = [];
      })
      
      // ========== GET BOOKING BY ID ==========
      .addCase(getBookingById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedBooking = action.payload;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      
      // ========== CREATE BOOKING ==========
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.selectedBooking = action.payload;
        
        // Add to items if we have bookings loaded
        if (state.items.length > 0) {
          state.items.unshift(action.payload);
        }
        
        // Update statistics
        state.statistics.total += 1;
        if (action.payload.status === 'PENDING') {
          state.statistics.pending += 1;
        }
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.createSuccess = false;
      })
      
      // ========== CANCEL BOOKING ==========
      .addCase(cancelBooking.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.cancelSuccess = true;
        
        // Update booking status in items
        const itemIndex = state.items.findIndex(
          b => b.booking_id === action.payload.bookingId
        );
        if (itemIndex !== -1) {
          const oldStatus = state.items[itemIndex].status;
          state.items[itemIndex].status = 'CANCELLED';
          state.items[itemIndex].cancellation_reason = action.payload.reason;
          
          // Update statistics
          if (oldStatus === 'PENDING') state.statistics.pending -= 1;
          if (oldStatus === 'ACCEPTED') state.statistics.accepted -= 1;
          state.statistics.cancelled += 1;
        }
        
        // Update selected booking
        if (state.selectedBooking?.booking_id === action.payload.bookingId) {
          state.selectedBooking.status = 'CANCELLED';
          state.selectedBooking.cancellation_reason = action.payload.reason;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
        state.cancelSuccess = false;
      })
      
      // ========== ACCEPT BOOKING ==========
      .addCase(acceptBooking.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.acceptSuccess = false;
      })
      .addCase(acceptBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.acceptSuccess = true;
        
        // Update booking status in ownerBookings
        const index = state.ownerBookings.findIndex(
          b => b.booking_id === action.payload
        );
        if (index !== -1) {
          const oldStatus = state.ownerBookings[index].status;
          state.ownerBookings[index].status = 'ACCEPTED';
          
          // Update statistics
          if (oldStatus === 'PENDING') state.statistics.pending -= 1;
          state.statistics.accepted += 1;
        }
        
        // Update selected booking
        if (state.selectedBooking?.booking_id === action.payload) {
          state.selectedBooking.status = 'ACCEPTED';
        }
      })
      .addCase(acceptBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
        state.acceptSuccess = false;
      })
      
      // ========== REJECT BOOKING ==========
      .addCase(rejectBooking.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.rejectSuccess = false;
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.rejectSuccess = true;
        
        // Update booking status in ownerBookings
        const index = state.ownerBookings.findIndex(
          b => b.booking_id === action.payload.bookingId
        );
        if (index !== -1) {
          const oldStatus = state.ownerBookings[index].status;
          state.ownerBookings[index].status = 'REJECTED';
          state.ownerBookings[index].rejection_reason = action.payload.reason;
          
          // Update statistics
          if (oldStatus === 'PENDING') state.statistics.pending -= 1;
          state.statistics.rejected += 1;
        }
        
        // Update selected booking
        if (state.selectedBooking?.booking_id === action.payload.bookingId) {
          state.selectedBooking.status = 'REJECTED';
          state.selectedBooking.rejection_reason = action.payload.reason;
        }
      })
      .addCase(rejectBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
        state.rejectSuccess = false;
      });
  },
});

export const {
  setActiveTab,
  clearSelectedBooking,
  clearSuccessMessages,
  clearError,
  updateBookingLocally,
  calculateStatistics,
  clearAllBookingData,
} = bookingSlice.actions;

export default bookingSlice.reducer;