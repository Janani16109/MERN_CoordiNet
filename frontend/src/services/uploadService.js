import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance for upload API
const uploadApi = axios.create({
  baseURL: `${API_URL}/api/upload`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add token to requests
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadService = {
  // Upload image to Cloudinary
  uploadImage: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadApi.post('/image', formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Image upload failed');
    }
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId) => {
    try {
      const response = await uploadApi.delete(`/image/${publicId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Image deletion failed');
    }
  },
};