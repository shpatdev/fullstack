// src/api/authApi.js
import { apiService } from './apiService.js';

export const authApi = {
  login: async (credentials) => {
    // credentials: { username (could be email), password }
    console.log('AUTH API (Mock): Attempting login with', credentials);

    // REAL API CALL STRUCTURE (if apiService didn't exist or for direct fetch):
    // const response = await fetch(`${API_BASE_URL}/token/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username: credentials.username, password: credentials.password })
    // });
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(errorData.detail || 'Login failed');
    // }
    // return response.json(); // Expects { access, refresh }

    // Using apiService for consistent request structure (even for mock)
    // return apiService.request('/token/', {
    //   method: 'POST',
    //   body: JSON.stringify({ username: credentials.username, password: credentials.password })
    // });

    // --- Mock Logic ---
    await new Promise(resolve => setTimeout(resolve, 500));
    let role = 'CUSTOMER'; // Default role
    let MOCK_USER_DB_ID = 1;
    let specificDetails = { name: `Mock ${role} User` };


    if (credentials.username === 'user@example.com' && credentials.password === 'password') {
      role = 'CUSTOMER'; MOCK_USER_DB_ID = 1; specificDetails = { name: 'Test Customer User'};
    } else if (credentials.username === 'owner@example.com' && credentials.password === 'password') {
      role = 'RESTAURANT_OWNER'; MOCK_USER_DB_ID = 2;
      specificDetails = {
        name: 'Test Restaurant Owner',
        ownsRestaurants: [{ id: 1, name: "Luigi's Mock Pizzeria", defaultMenuId: "MENU_MOCK_1", address: "123 Pizza St (Mock)"}]
      };
    } else if (credentials.username === 'driver@example.com' && credentials.password === 'password') {
      role = 'DRIVER'; MOCK_USER_DB_ID = 3;
      specificDetails = {
        name: 'Test Driver User',
        driverProfile: { id: 103, isOnline: false, vehicle_type: "SCOOTER" } // Mock driver profile ID
      };
    } else if (credentials.username === 'admin@example.com' && credentials.password === 'password') {
      role = 'ADMIN'; MOCK_USER_DB_ID = 4; specificDetails = { name: 'Test Admin User'};
    } else {
      throw new Error('Invalid credentials (mock API)');
    }

    const token = `mock_access_token_for_${role.toLowerCase()}_${Date.now()}`;
    localStorage.setItem('mockRole', role); // Store role for mock fetchCurrentUser
    localStorage.setItem('mockUserId', MOCK_USER_DB_ID.toString()); // Ensure it's a string for localStorage
    localStorage.setItem('mockUserDetails', JSON.stringify(specificDetails));

    return { access: token, refresh: `mock_refresh_${token}` };
  },

  register: async (userData) => {
    // userData: { username, email, password, role: "CUSTOMER" }
    console.log('AUTH API (Mock): Attempting registration with', userData);
    // REAL API CALL STRUCTURE:
    // return apiService.request('/register/', { method: 'POST', body: JSON.stringify(userData) });

    // --- Mock Logic ---
    await new Promise(resolve => setTimeout(resolve, 500));
    if (userData.email === 'existing@example.com') {
        throw new Error('Email already exists (mock API)');
    }
    // Mock: Registration successful, but does not auto-login for this mock.
    // A real backend might return tokens and user object.
    return {
        id: Date.now(), // Mock ID
        username: userData.username,
        email: userData.email,
        role: userData.role || "CUSTOMER",
        message: "Registration successful. Please login." // Example message
        // If backend returns tokens upon registration:
        // access: `mock_access_token_reg_${userData.email}`,
        // refresh: `mock_refresh_token_reg_${userData.email}`
    };
  },

  fetchCurrentUser: async (/* currentToken is implicitly used by apiService */) => {
    console.log('AUTH API (Mock): Fetching current user');
    // REAL API CALL STRUCTURE (Token is automatically added by apiService.request):
    // return apiService.request('/users/me/');

    // --- Mock Logic ---
    await new Promise(resolve => setTimeout(resolve, 300));
    const tokenFromStorage = localStorage.getItem('accessToken');
    const mockRole = localStorage.getItem('mockRole') || 'CUSTOMER';
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr, 10) : Date.now(); // Parse if exists
    const mockUserDetailsString = localStorage.getItem('mockUserDetails');
    const mockUserDetails = mockUserDetailsString ? JSON.parse(mockUserDetailsString) : {};


    if (tokenFromStorage && tokenFromStorage.startsWith('mock_access_token_for_')) {
      let userEmail = `${mockRole.toLowerCase().replace(/_/g, '')}${mockUserId}@example.com`;

      const baseUser = {
        id: mockUserId,
        username: userEmail.split('@')[0],
        email: userEmail,
        role: mockRole,
      };

      // Merge role-specific details
      const fullUser = { ...baseUser, ...mockUserDetails };

      return fullUser;
    }
    throw new Error('Not authenticated or invalid token (mock API for fetchCurrentUser)');
  },

  // logout: async (refreshToken) => {
  //   console.log('AUTH API (Mock): Attempting logout');
  //   // REAL: return apiService.request('/logout/', { method: 'POST', body: JSON.stringify({ refresh: refreshToken }) });
  //   await new Promise(resolve => setTimeout(resolve, 300));
  //   return { detail: "Successfully logged out (mock)." };
  // }
};