// src/api/adminApi.js
import { apiService } from './apiService.js'; // Supozojmë helper-in gjenerik

export const adminApi = {
  // --- User CRUD ---
  fetchAllUsers: async () => { // Token is handled by apiService
    console.log("ADMIN API: Fetching all users");
    return apiService.request('/admin/users/'); // Example real endpoint
  },
  createUser: async (userData) => { // Token is handled by apiService
    console.log("ADMIN API: Creating user:", userData);
    // Ensure userData includes is_staff, is_available_for_delivery if set from UserFormModal
    return apiService.request('/admin/users/', { method: 'POST', body: JSON.stringify(userData) });
  },
  updateUser: async (userId, userData) => { // Token is handled by apiService
    console.log("ADMIN API: Updating user:", userId, userData);
    // Ensure userData includes is_staff, is_available_for_delivery if set from UserFormModal
    // Email should not be in userData if it's readOnly for edit
    return apiService.request(`/admin/users/${userId}/`, { method: 'PATCH', body: JSON.stringify(userData) });
  },
  deleteUser: async (userId) => { // Token is handled by apiService
    console.log("ADMIN API: Deleting user:", userId);
    return apiService.request(`/admin/users/${userId}/`, { method: 'DELETE' });
  },
  resetUserPasswordAdmin: async (userId) => { // Token is handled by apiService
    console.log("ADMIN API: Resetting password for user:", userId);
    // Backend needs an endpoint for this, e.g., /api/admin/users/{user_id}/reset-password/
    return apiService.request(`/admin/users/${userId}/reset-password/`, { method: 'POST' });
  },

  // --- Restaurant CRUD ---
  fetchAllRestaurants: async () => { // Token is handled by apiService
    console.log("ADMIN API: Fetching all restaurants");
    return apiService.request('/restaurants/'); // Assuming a general endpoint, admin backend might have /api/admin/restaurants/
  },
  fetchPotentialOwners: async () => { // Token is handled by apiService
    console.log("ADMIN API: Fetching potential owners (RESTAURANT_OWNER, ADMIN)");
    // Backend should support filtering by multiple roles if needed, or fetch all and filter on client (less ideal)
    // Example: /api/users/?role__in=RESTAURANT_OWNER,ADMIN
    return apiService.request('/users/?role__in=RESTAURANT_OWNER,ADMIN');
  },
  createRestaurant: async (restaurantData, imageFile = null) => { // Token is handled by apiService
    console.log("ADMIN API: Creating restaurant:", restaurantData);
    const finalPayload = { ...restaurantData };
    delete finalPayload.imageFile; // Remove the temporary key

    if (imageFile) {
        const formData = new FormData();
        Object.keys(finalPayload).forEach(key => {
            if (finalPayload[key] !== null && finalPayload[key] !== undefined) {
                 if (key === 'category_ids' && Array.isArray(finalPayload[key])) {
                    finalPayload[key].forEach(id => formData.append('category_ids', id));
                } else {
                    formData.append(key, finalPayload[key]);
                }
            }
        });
        formData.append('image', imageFile, imageFile.name);
        return apiService.requestWithFormData('/restaurants/', formData, { method: 'POST' });
    } else {
        return apiService.request('/restaurants/', { method: 'POST', body: JSON.stringify(finalPayload) });
    }
  },
  updateRestaurant: async (restaurantId, restaurantData, imageFile = null) => { // Token is handled by apiService
    console.log("ADMIN API: Updating restaurant:", restaurantId, restaurantData);
    const finalPayload = { ...restaurantData };
    delete finalPayload.imageFile; // Remove the temporary key

    if (imageFile) {
        const formData = new FormData();
        Object.keys(finalPayload).forEach(key => {
            if (finalPayload[key] !== null && finalPayload[key] !== undefined) {
                if (key === 'category_ids' && Array.isArray(finalPayload[key])) {
                    finalPayload[key].forEach(id => formData.append('category_ids', id));
                } else {
                    formData.append(key, finalPayload[key]);
                }
            }
        });
        formData.append('image', imageFile, imageFile.name);
        return apiService.requestWithFormData(`/restaurants/${restaurantId}/`, formData, { method: 'PATCH' });
    } else {
        return apiService.request(`/restaurants/${restaurantId}/`, { method: 'PATCH', body: JSON.stringify(finalPayload) });
    }
  },
  // deleteRestaurant: async (restaurantId, token) => { /* ... */ },

  approveRestaurant: async (restaurantId) => { // Token is handled by apiService
    console.log("ADMIN API: Approving restaurant:", restaurantId);
    // Backend needs an endpoint for this, e.g., /api/admin/restaurants/{restaurant_id}/approve/
    return apiService.request(`/admin/restaurants/${restaurantId}/approve/`, { method: 'POST' });
  },

  toggleRestaurantActiveStatus: async (restaurantId, isActive) => { // Token is handled by apiService
    console.log(`ADMIN API: Setting restaurant ${restaurantId} active status to:`, isActive);
    // Backend might expect PATCH on the restaurant resource with { is_active: isActive }
    // or a dedicated endpoint /api/admin/restaurants/{restaurant_id}/toggle-active/
    return apiService.request(`/restaurants/${restaurantId}/`, { 
        method: 'PATCH', 
        body: JSON.stringify({ is_active: isActive }) 
    });
  },

  // Placeholder for fetching all restaurant categories (global ones)
  fetchAllRestaurantCategories: async () => { // Token is handled by apiService
    console.log("ADMIN API: Fetching all global restaurant categories");
    return apiService.request('/cuisine-types/'); // Assuming global endpoint
  },

  // --- Platform Settings ---
  fetchPlatformSettings: async () => {
    return apiService.request('/admin/platform-settings/');
  },
  updatePlatformSettings: async (settingsData) => {
    return apiService.request('/admin/platform-settings/', {
      method: 'PATCH', // Or POST if it's a create/replace operation
      body: JSON.stringify(settingsData),
    });
  },
  
  // --- Admin Orders ---
  getAllOrders: async (params) => { // params = { page, search, status }
    return apiService.request('/admin/orders/', { params });
  },
  updateOrderStatus: async (orderId, newStatus) => {
    return apiService.request(`/admin/orders/${orderId}/update-status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });
  },

  // --- Admin Dashboard/Overview ---
  fetchAdminOverviewStats: async () => {
    return apiService.request('/admin/overview-stats/');
  },
  fetchAdminRecentActivities: async () => {
    return apiService.request('/admin/recent-activities/');
  }
};