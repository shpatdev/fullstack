// src/api/customerApi.js
import { apiService } from './apiService.js';

export const customerApi = {
  fetchActiveRestaurants: async () => {
    return apiService.request('/restaurants/');
  },
  fetchRestaurantById: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/`);
  },
  fetchMenuCategoriesWithItems: async (restaurantId) => { // Renamed from fetchMenuItemsForRestaurant for clarity
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`); // Assuming this returns categories with items
  },
  fetchRestaurantReviews: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/reviews/`);
  },
  submitRestaurantReview: async (restaurantId, reviewData) => {
    return apiService.request(`/restaurants/${restaurantId}/reviews/submit/`, { // Adjusted endpoint
      method: 'POST',
      body: reviewData,
    });
  },

  // --- Cart Operations ---
  fetchUserCart: async () => {
    console.log('CUSTOMER API (Real): Fetching user cart from backend. Attempting to request /cart/my-cart/'); // ADD THIS LOG
    return apiService.request('/cart/my-cart/');
  },
  addItemToCart: async (menuItemId, quantity) => {
    return apiService.request('/cart/add-item/', {
      method: 'POST',
      body: { menu_item_id: menuItemId, quantity },
    });
  },
  updateCartItemQuantity: async (cartItemId, newQuantity) => {
    // This URL should match the backend's updated @action url_path
    // e.g., /api/cart/update-item/{item_pk}/
    return apiService.request(`/cart/update-item/${cartItemId}/`, {
      method: 'PATCH',
      body: { quantity: newQuantity }, // Ensure backend expects { "quantity": X }
    });
  },
  removeCartItem: async (cartItemId) => {
    // This URL should match the backend's updated @action url_path
    // e.g., /api/cart/remove-item/{item_pk}/
    return apiService.request(`/cart/remove-item/${cartItemId}/`, {
      method: 'DELETE',
    });
  },
  clearUserCart: async () => {
    return apiService.request('/cart/clear/', {
      method: 'POST', // Or DELETE, depending on backend implementation
    });
  },

  // --- User Profile & Addresses ---
  fetchUserProfile: async () => {
    return apiService.request('/auth/users/me/');
  },
  updateUserProfile: async (userData) => {
    return apiService.request('/auth/users/me/', {
      method: 'PATCH', // or PUT
      body: userData,
    });
  },
  fetchUserAddresses: async () => {
    console.log("customerApi.fetchUserAddresses called, will request '/addresses/'"); // VERIFIKO QE ESHTE KETU
    return apiService.request('/addresses/');
  },
  createUserAddress: async (addressData) => {
    return apiService.request('/addresses/', {
      method: 'POST',
      body: addressData, // Assuming apiService handles JSON.stringify if needed
    });
  },
  updateUserAddress: async (addressId, addressData) => {
    return apiService.request(`/addresses/${addressId}/`, {
      method: 'PATCH', // or PUT
      body: addressData, // Assuming apiService handles JSON.stringify if needed
    });
  },
  deleteUserAddress: async (addressId) => {
    return apiService.request(`/addresses/${addressId}/`, {
      method: 'DELETE',
    });
  },

  // --- Order Operations ---
  createOrder: async (orderData) => {
    // orderData should include: restaurant_id, delivery_address_id, payment_method, delivery_address_notes
    return apiService.request('/orders/create/', { // Assuming a dedicated create endpoint
      method: 'POST',
      body: orderData,
    });
  },
  fetchUserOrders: async () => {
    return apiService.request('/orders/'); // Backend should filter by user
  },
  fetchOrderDetails: async (orderId) => {
    return apiService.request(`/orders/${orderId}/`);
  },
};