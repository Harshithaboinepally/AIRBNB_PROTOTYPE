import api from './api';

const dashboardService = {
    // Get traveler dashboard
    getTravelerDashboard: async () => {
        const response = await api.get('/api/dashboard/traveler');
        return response.data;
    },

    // Get owner dashboard
    getOwnerDashboard: async () => {
        const response = await api.get('/api/dashboard/owner');
        return response.data;
    }
};

export default dashboardService;