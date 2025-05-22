// src/api/authApi.js
import { apiService } from './apiService.js';

export const authApi = {
  login: async (credentials) => {
    // credentials: { username (email for Django SimpleJWT), password }
    console.log('AUTH API: Attempting login with', credentials);
    // REAL API CALL (uncomment and adjust URL if needed for your backend):
    // return apiService.request('/token/', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ username: credentials.username, password: credentials.password }) 
    // });
    
    // Mock from Gemini for now:
    await new Promise(resolve => setTimeout(resolve, 500));
    if ((credentials.username === 'user@example.com' || credentials.username === 'owner@example.com' || credentials.username === 'driver@example.com' || credentials.username === 'admin@example.com') && credentials.password === 'password') {
      let role = 'CUSTOMER'; // Default role for this mock login
      if (credentials.username === 'owner@example.com') role = 'RESTAURANT_OWNER';
      if (credentials.username === 'driver@example.com') role = 'DRIVER';
      if (credentials.username === 'admin@example.com') role = 'ADMIN';
      
      const token = `mock_access_token_for_${role.toLowerCase()}_${Date.now()}`;
      localStorage.setItem('mockRole', role); // Store role for mock fetchCurrentUser
      return { access: token, refresh: `mock_refresh_${token}` };
    }
    throw new Error('Invalid credentials (mock API)');
  },

  register: async (userData) => {
    // userData: { username, email, password, role: "CUSTOMER" }
    console.log('AUTH API: Attempting registration with', userData);
    // REAL API CALL (uncomment and adjust URL if needed):
    // return apiService.request('/register/', { method: 'POST', body: JSON.stringify(userData) });
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 500));
    if (userData.email === 'existing@example.com') {
        throw new Error('Email already exists (mock API)');
    }
    // For real API, backend creates user and might return user object and/or tokens.
    // This mock assumes registration is successful and then a login (or token retrieval) would happen.
    return { 
        id: Date.now(), 
        username: userData.username, 
        email: userData.email, 
        role: userData.role || "CUSTOMER",
        // If backend returns tokens upon registration:
        // access: `mock_access_token_reg_${userData.email}`,
        // refresh: `mock_refresh_token_reg_${userData.email}`
    };
  },

  fetchCurrentUser: async () => { 
    console.log('AUTH API: Fetching current user');
    // REAL API CALL (uncomment and adjust URL if needed):
    // Token is automatically added by apiService.request
    // return apiService.request('/users/me/'); 
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const token = localStorage.getItem('accessToken'); // AuthContext stores this
    const mockRole = localStorage.getItem('mockRole') || 'CUSTOMER'; // Role stored by mock login, default

    // Simulate fetching user based on the mock token role
    if (token && token.startsWith('mock_access_token_for_')) {
        let name = `Mock ${mockRole} User`;
        let email = `${mockRole.toLowerCase()}@example.com`;
        if (mockRole === 'CUSTOMER' && token.includes('_from_api')) { // Specific mock for initial login
            name = 'Test User from API';
            email = 'user@example.com';
        }
        
        const userDetails = { 
            id: Date.now(), 
            username: email.split('@')[0], 
            email: email, 
            name: name, 
            role: mockRole,
        };

        if (mockRole === 'RESTAURANT_OWNER') {
            userDetails.ownsRestaurants = [{ id: 1, name: "Luigi's Mock Pizzeria", defaultMenuId: "MENU_MOCK_1"}];
        }
        return userDetails;
    }
    throw new Error('Not authenticated or invalid token (mock API for fetchCurrentUser)');
  },
};