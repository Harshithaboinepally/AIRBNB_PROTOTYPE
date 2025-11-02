import api from './api';

const propertyService = {
    // Search properties
    searchProperties: async (params) => {
        const response = await api.get('/api/properties/search', { params });
        return response.data;
    },

    // Get property by ID
    getPropertyById: async (id) => {
        const response = await api.get(`/api/properties/${id}`);
        return response.data;
    },

    // Create property (owner)
    createProperty: async (propertyData) => {
        const response = await api.post('/api/properties', propertyData);
        return response.data;
    },

    // Update property (owner)
    updateProperty: async (id, propertyData) => {
        const response = await api.put(`/api/properties/${id}`, propertyData);
        return response.data;
    },

    // Delete property (owner)
    deleteProperty: async (id) => {
        const response = await api.delete(`/api/properties/${id}`);
        return response.data;
    },

    // Get owner's properties
    getOwnerProperties: async () => {
        const response = await api.get('/api/properties/owner/my-properties');
        return response.data;
    },

    // Upload property images
    uploadPropertyImages: async (propertyId, files) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('propertyImages', file);
        });
        
        const response = await api.post(`/api/properties/${propertyId}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default propertyService;