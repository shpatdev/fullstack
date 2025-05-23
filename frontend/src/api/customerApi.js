// src/api/customerApi.js
import { apiService } from './apiService.js';

export const customerApi = {
  // ... (fetchActiveRestaurants, fetchRestaurantById, fetchMenuItemsForRestaurant, fetchMenuCategoriesWithItems siç ishin) ...
  fetchActiveRestaurants: async () => {
    return apiService.request('/restaurants/');
  },
  fetchRestaurantById: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/`);
  },
  fetchMenuItemsForRestaurant: async (restaurantId) => { // Nga @action e RestaurantViewSet
    return apiService.request(`/restaurants/${restaurantId}/menu-items/`);
  },
  fetchMenuCategoriesWithItems: async (restaurantId) => { // Nga @action e RestaurantViewSet
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`);
  },

  // --- Cart related functions (këto duhet të jenë të lidhura me API-në e shportës nëse e ke) ---
  // Për momentin, CartContext përdor localStorage për mock.
  // Për API reale, këto do të thërrisnin endpoint-et e shportës.
  fetchUserCart: async () => {
    console.warn('CUSTOMER API (Cart): fetchUserCart called - using localStorage mock for now.');
    const mockUserIdStr = localStorage.getItem('mockUserId') || (JSON.parse(localStorage.getItem('user'))?.id) || 'GUEST'; // Përdor user.id nëse ka
    const cartKey = `mockCustomerCartItems_${mockUserIdStr}`;
    const currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const totalAmount = currentMockCartItems.reduce((sum, item) => sum + parseFloat(item.menu_item_details?.price || 0) * item.quantity, 0);
    return Promise.resolve({ // Kthe Promise për konsistencë
        id: `CART_MOCK_${mockUserIdStr}`,
        user: mockUserIdStr !== 'GUEST' ? parseInt(mockUserIdStr) : null,
        items: currentMockCartItems,
        total_amount: totalAmount.toFixed(2)
    });
  },
  addItemToCart: async (menuItemId, quantity, menuItemDetails) => {
    console.warn('CUSTOMER API (Cart): addItemToCart called - using localStorage mock for now.');
    const mockUserIdStr = localStorage.getItem('mockUserId') || (JSON.parse(localStorage.getItem('user'))?.id) || 'GUEST';
    const cartKey = `mockCustomerCartItems_${mockUserIdStr}`;
    const currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existingItemIndex = currentMockCartItems.findIndex(item => item.menu_item === menuItemId);
    if (existingItemIndex > -1) {
        currentMockCartItems[existingItemIndex].quantity += quantity;
    } else {
        currentMockCartItems.push({
            id: `CART_ITEM_MOCK_${Date.now()}`,
            cart: `CART_MOCK_${mockUserIdStr}`,
            menu_item: menuItemId,
            quantity: quantity,
            menu_item_details: { ...menuItemDetails }
        });
    }
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return Promise.resolve({ success: true, message: "Item added to mock cart" });
  },
  updateCartItemQuantity: async (cartItemId, newQuantity) => {
    console.warn('CUSTOMER API (Cart): updateCartItemQuantity called - using localStorage mock for now.');
    const mockUserIdStr = localStorage.getItem('mockUserId') || (JSON.parse(localStorage.getItem('user'))?.id) || 'GUEST';
    const cartKey = `mockCustomerCartItems_${mockUserIdStr}`;
    let currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (newQuantity <= 0) {
        currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    } else {
        const itemIndex = currentMockCartItems.findIndex(item => item.id === cartItemId);
        if (itemIndex > -1) currentMockCartItems[itemIndex].quantity = newQuantity;
    }
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return Promise.resolve({ success: true, message: "Mock cart quantity updated" });
  },
  removeCartItem: async (cartItemId) => {
    console.warn('CUSTOMER API (Cart): removeCartItem called - using localStorage mock for now.');
    const mockUserIdStr = localStorage.getItem('mockUserId') || (JSON.parse(localStorage.getItem('user'))?.id) || 'GUEST';
    const cartKey = `mockCustomerCartItems_${mockUserIdStr}`;
    let currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return Promise.resolve({ success: true, message: "Mock cart item removed" });
  },
   clearUserCartMock: async () => { // Funksion për të pastruar shportën mock
    console.warn('CUSTOMER API (Cart): clearUserCartMock called - using localStorage mock for now.');
    const mockUserIdStr = localStorage.getItem('mockUserId') || (JSON.parse(localStorage.getItem('user'))?.id) || 'GUEST';
    const cartKey = `mockCustomerCartItems_${mockUserIdStr}`;
    localStorage.removeItem(cartKey);
    return Promise.resolve({ success: true, message: "Mock cart cleared" });
  },


  // --- Order related functions (LIDHUR ME BACKEND TANI) ---
  createOrder: async (orderData) => {
    console.log('CUSTOMER API (Real): Creating order', orderData);
    // orderData duhet të përmbajë: restaurant_id, delivery_address_id, items (listë e {menu_item: id, quantity: x}), payment_method
    return apiService.request('/orders/', { method: 'POST', body: JSON.stringify(orderData) });
  },
  fetchUserOrders: async () => {
    console.log('CUSTOMER API (Real): Fetching user orders');
    // Backend OrderViewSet.get_queryset() filtron për userin e kyçur
    const response = await apiService.request('/orders/');
    return response.results || []; // Kthe results ose një array bosh
  },
  fetchOrderById: async (orderId) => { // Për OrderConfirmationPage (opsionale)
    console.log(`CUSTOMER API (Real): Fetching order by ID: ${orderId}`);
    return apiService.request(`/orders/${orderId}/`);
  },
  
  // --- Address related functions (LIDHUR ME BACKEND TANI) ---
  fetchUserAddresses: async () => {
    return apiService.request('/addresses/');
  },
  createUserAddress: async (addressData) => {
    return apiService.request('/addresses/', { method: 'POST', body: JSON.stringify(addressData) });
  },
  updateUserAddress: async (addressId, addressData) => {
    return apiService.request(`/addresses/${addressId}/`, { method: 'PATCH', body: JSON.stringify(addressData) });
  },
  deleteUserAddress: async (addressId) => {
    return apiService.request(`/addresses/${addressId}/`, { method: 'DELETE' });
  },

  // --- Review related functions (LIDHUR ME BACKEND TANI) ---
  fetchRestaurantReviews: async (restaurantId) => {
    console.log(`CUSTOMER API (Real): Fetching reviews for restaurant ${restaurantId}`);
    return apiService.request(`/restaurants/${restaurantId}/reviews/`);
  },
  submitRestaurantReview: async (restaurantId, reviewData) => {
    // reviewData duhet të jetë { rating: number, comment: string }
    console.log(`CUSTOMER API (Real): Submitting review for restaurant ${restaurantId}`, reviewData);
    return apiService.request(`/restaurants/${restaurantId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },
};