// src/api/authApi.js
import { apiService } from './apiService.js'; // Assuming a central apiService helper

export const authApi = {
  login: async (credentials) => {
    // credentials: { username: "email_or_username", password: "password" }
    console.log('API: Attempting login with', credentials);
    // REAL API CALL:
    // return apiService.request('/token/', { method: 'POST', body: JSON.stringify(credentials) });
    
    // Mock from Gemini for now:
    await new Promise(resolve => setTimeout(resolve, 500));
    if (credentials.username === 'user@example.com' && credentials.password === 'password') {
      return { access: 'mock_access_token_from_api', refresh: 'mock_refresh_token_from_api' };
    }
    throw new Error('Invalid credentials (mock API)');
  },
  register: async (userData) => {
    // userData: { username, email, password, role: "CUSTOMER" }
    console.log('API: Attempting registration with', userData);
    // REAL API CALL:
    // return apiService.request('/register/', { method: 'POST', body: JSON.stringify(userData) });
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 500));
    if (userData.email === 'existing@example.com') {
        throw new Error('Email already exists (mock API)');
    }
    // Backend should ideally return the created user object AND tokens or allow immediate login
    return { 
        id: Date.now(), 
        username: userData.username, 
        email: userData.email, 
        role: "CUSTOMER",
        // Simulating tokens being returned or a subsequent login being made:
        access: `mock_access_token_reg_${userData.email}`, 
        refresh: `mock_refresh_token_reg_${userData.email}`
    };
  },
  fetchCurrentUser: async () => {
    console.log('API: Fetching current user');
    // REAL API CALL:
    // return apiService.request('/users/me/'); // Token is handled by apiService.request
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const token = localStorage.getItem('accessToken'); // Assuming token is stored by AuthContext
    if (token === 'mock_access_token_from_api') {
        return { id: 1, username: 'user@example.com', email: 'user@example.com', name: 'Test User from API', role: 'CUSTOMER' };
    }
    // Adjusted mock for registration flow if it sets a specific token format
    if (token && token.startsWith('mock_access_token_reg_')) {
        const emailFromToken = token.substring('mock_access_token_reg_'.length);
        return { id: Date.now(), username: emailFromToken.split('@')[0], email: emailFromToken, name: `New User (${emailFromToken.split('@')[0]})`, role: 'CUSTOMER' };
    }
    // If token is generic after register (meaning login was separate or backend returned standard tokens)
    // this part of mock might need adjustment or real API will just work.
    throw new Error('Not authenticated (mock API for fetchCurrentUser)');
  },
};