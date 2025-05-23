// src/api/authApi.js
import { apiService } from './apiService.js';

export const authApi = {
  login: async (credentials) => {
    // Credentials duhet të jetë një objekt { email, password }
    // Backend-i pret { "email": "...", "password": "..." }
    // apiService.request do ta stringify këtë objekt dhe do të vendosë Content-Type: application/json
    console.log('authApi.login: Dërgohen kredencialet:', credentials);
    return apiService.request('/auth/login/', { // NDRYSHUAR NGA /auth/token/
      method: 'POST',
      body: credentials, // apiService do ta bëjë JSON.stringify(credentials)
    });
  },

  register: async (userData) => {
    // userData nga frontend (p.sh. RegisterPage.jsx) duhet të jetë: 
    // { username (përdoret si first_name+last_name kombinim te disa vende, por backend pret fushat veç), 
    //   email, password, password_confirm, role, first_name, last_name, phone_number }
    
    const payload = {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: userData.password,
        password_confirm: userData.password_confirm || userData.password, // Sigurohu që forma e dërgon këtë
        role: userData.role || "CUSTOMER", 
        phone_number: userData.phone_number || null,
        // profile_picture: ... // File upload trajtohet ndryshe
    };
    console.log('AUTH API (Real): Attempting registration with payload:', payload);
    return apiService.request('/auth/register/', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
    });
  },

  fetchMe: async () => {
    // Nuk ka nevojë për token këtu, apiService e menaxhon atë
    return apiService.request('/auth/me/', { method: 'GET' });
  },

  // Funksion i ri për admin login, nëse endpointi është ndryshe
  adminLogin: async (credentials) => {
    console.log('authApi.adminLogin: Dërgohen kredencialet:', credentials);
    // Supozojmë se përdor të njëjtin endpoint tokeni por mund të ketë logjikë shtesë
    // ose një endpoint të dedikuar si '/auth/admin-token/'
    // Përderisa backend-i ka /api/auth/login/ për të gjithë, e përdorim këtë.
    return apiService.request('/auth/login/', { // NDRYSHUAR NGA /auth/token/
      method: 'POST',
      body: credentials,
    });
  },

  // Funksion për ndryshimin e fjalëkalimit
  changePassword: async (passwordData) => {
    // passwordData duhet të ketë fushat e nevojshme si currentPassword, newPassword, etj.
    console.log('AUTH API (Real): Attempting password change with data:', passwordData);
    return apiService.request('/auth/change-password/', { 
        method: 'POST', 
        body: JSON.stringify(passwordData) 
    });
  },
};