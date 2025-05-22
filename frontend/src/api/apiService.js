// src/api/apiService.js
// Base URL for your Django backend
const API_BASE_URL = 'http://localhost:8000/api'; // Replace if different

export const apiService = {
  getAuthToken: () => localStorage.getItem('accessToken'), // Or however you store your token

  request: async (endpoint, options = {}) => {
    const token = apiService.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 204) { // No Content
        return null; 
      }

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`API Error ${response.status} for ${endpoint}:`, responseData);
        // Try to extract a meaningful error message from backend if possible
        const message = responseData.detail || responseData.error || responseData.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return responseData;
    } catch (error) {
      console.error(`Network or parsing error for ${endpoint}:`, error);
      throw error; // Re-throw the error to be caught by the calling function
    }
  },
};