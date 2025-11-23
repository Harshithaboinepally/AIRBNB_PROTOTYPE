import api from './api';

const bookingService = {
    // Create booking
    createBooking: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },

    // Get traveler's bookings
    getTravelerBookings: async (status) => {
        const params = status ? { status } : {};
        const response = await api.get('/bookings/traveler', { params });
        return response.data;
    },

    // Get owner's bookings
    getOwnerBookings: async (status) => {
        const params = status ? { status } : {};
        const response = await api.get('/bookings/owner', { params });
        return response.data;
    },

    // Get booking by ID
    getBookingById: async (id) => {
        const response = await api.get(`/bookings/${id}`);
        return response.data;
    },

    // Accept booking (owner)
    acceptBooking: async (id) => {
        const response = await api.put(`/bookings/${id}/accept`);
        return response.data;
    },

    // Reject booking (owner)
    rejectBooking: async (id, reason) => {
        const response = await api.put(`/bookings/${id}/reject`, {
            rejection_reason: reason
        });
        return response.data;
    },

    // Cancel booking (traveler)
    cancelBooking: async (id, reason) => {
        const response = await api.put(`/bookings/${id}/cancel`, {
            cancellation_reason: reason
        });
        return response.data;
    }
};

export default bookingService;