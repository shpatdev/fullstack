// src/api/apiService.js
const API_BASE_URL = 'http://localhost:8000/api'; // Replace with your actual backend URL

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
      console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`, { headers, body: options.body ? 'Present' : 'Not Present' });
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 204) { // No Content
        return null; 
      }

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          responseData = await response.json();
      } else {
          const textResponse = await response.text();
          responseData = { detail: textResponse || response.statusText }; 
      }

      if (!response.ok) {
        console.error(`API Error ${response.status} for ${API_BASE_URL}${endpoint}:`, responseData);
        const message = responseData.detail || responseData.error || responseData.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      return responseData;
    } catch (error) {
      console.error(`Network or parsing error for ${API_BASE_URL}${endpoint}:`, error);
      if (error instanceof Error) {
          throw error;
      } else {
          throw new Error('An unknown network error occurred.');
      }
    }
  },
};