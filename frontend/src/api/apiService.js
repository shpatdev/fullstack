// src/api/apiService.js
const API_BASE_URL = 'http://localhost:8000/api'; // Ensure this is your correct API base URL

export const apiService = {
  getAuthToken: () => localStorage.getItem('authToken'),

  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  clearToken: () => {
    localStorage.removeItem('authToken');
  },

  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json', // Default Content-Type
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // Stringify the body if it's a POST/PUT/PATCH request with JSON Content-Type and body is an object
    if (config.body && typeof config.body === 'object' && 
        headers['Content-Type'] === 'application/json' && 
        !(config.body instanceof FormData)) { // FormData is handled by requestWithFormData or should not be stringified
      config.body = JSON.stringify(config.body);
    }


    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({ detail: 'Failed to parse JSON error response.' }));
        } else {
          const textError = await response.text().catch(() => 'Failed to read error response text.');
          errorData = { detail: textError || response.statusText };
        }
        
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        error.response = errorData; 
        error.status = response.status;
        throw error;
      }
      if (response.status === 204) {
        return null;
      }
      // Ensure we attempt to parse JSON only if there's a body.
      // Some successful responses (like 200 OK for a DELETE) might not have a body.
      const responseText = await response.text();
      if (!responseText) {
        return null; // Or an appropriate representation of an empty successful response
      }
      return JSON.parse(responseText); // Parse the text manually after checking it's not empty
    } catch (error) {
      // If the error is already an enriched one from the !response.ok block, rethrow it
      if (error.status && error.response) {
        console.error('API request failed (pre-enriched):', error.message, 'Endpoint:', endpoint, 'Status:', error.status, 'Response:', JSON.stringify(error.response, null, 2));
        throw error;
      }
      // Otherwise, log and throw a generic or new error
      console.error('API request failed (generic catch):', error.message, 'Endpoint:', endpoint, 'Config:', JSON.stringify(config, null, 2), 'Original Error:', error);
      throw error; // Re-throw the original error or a new one
    }
  },

  requestWithFormData: async (endpoint, formData, options = {}) => {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      // 'Content-Type' is not set for FormData, browser does it.
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: 'POST', 
      ...options,
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({ detail: 'Failed to parse JSON error response.' }));
        } else {
          const textError = await response.text().catch(() => 'Failed to read error response text.');
          errorData = { detail: textError || response.statusText };
        }

        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        error.response = errorData;
        error.status = response.status;
        throw error;
      }
      if (response.status === 204) {
        return null;
      }
      // Similar handling for potentially empty successful responses
      const responseText = await response.text();
      if (!responseText) {
        return null;
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error('API FormData request failed:', error.message, 'Endpoint:', endpoint, 'Original Error:', error);
      throw error;
    }
  }
};