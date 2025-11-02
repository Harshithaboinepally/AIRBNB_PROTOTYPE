import api from './api';

const bookingService = {
    // Create booking
    createBooking: async (bookingData) => {
        const response = await api.post('/api/bookings', bookingData);
        return response.data;
    },

    // Get traveler's bookings
    getTravelerBookings: async (status) => {
        const params = status ? { status } : {};
        const response = await api.get('/api/bookings/traveler', { params });
        return response.data;
    },

    // Get owner's bookings
    getOwnerBookings: async (status) => {
        const params = status ? { status } : {};
        const response = await api.get('/api/bookings/owner', { params });
        return response.data;
    },

    // Get booking by ID
    getBookingById: async (id) => {
        const response = await api.get(`/api/bookings/${id}`);
        return response.data;
    },

    // Accept booking (owner)
    acceptBooking: async (id) => {
        const response = await api.put(`/api/bookings/${id}/accept`);
        return response.data;
    },

    // Cancel booking
    cancelBooking: async (id, reason) => {
        const response = await api.put(`/api/bookings/${id}/cancel`, {
            cancellation_reason: reason
        });
        return response.data;
    }
};

export default bookingService;