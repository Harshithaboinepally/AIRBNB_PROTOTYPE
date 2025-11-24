import api from './api';

const userService = {
    // Get profile
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        return response.data;
    },

    // Upload profile picture
    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        const response = await api.post('/users/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export default userService;
