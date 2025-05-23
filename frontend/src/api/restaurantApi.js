// src/api/restaurantApi.js
import { apiService } from './apiService.js';

export const restaurantApi = {
  // --- Restaurant Details & Settings (LIDHUR ME BACKEND) ---
  fetchRestaurantDetails: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/`);
  },
  updateRestaurantDetails: async (restaurantId, detailsData) => {
    // KUJDES: Për ngarkim fotosh, apiService.request duhet të modifikohet për FormData
    // Tani për tani, supozojmë se 'main_image_url_placeholder' dërgohet si string
    let payload = {...detailsData};
    if (payload.image) delete payload.image; // Hiq objektin File nëse ekziston
    // main_image_url_placeholder duhet të jetë fusha që pret backend-i për URL-në
    return apiService.request(`/restaurants/${restaurantId}/`, { 
      method: 'PATCH', 
      body: JSON.stringify(payload) 
    });
  },
  setOpeningHours: async (restaurantId, hoursDataArray) => {
    // Ky endpoint duhet të krijohet në backend, p.sh., si @action
    // Për momentin e komentojmë thirrjen reale dhe kthejmë një Promise mock
    console.warn(`RO_API: setOpeningHours called for ${restaurantId}. Endpoint needs to be implemented in backend.`);
    // return apiService.request(`/restaurants/${restaurantId}/set-operating-hours/`, { // KRIJO KËTË ENDPOINT
    //   method: 'POST', 
    //   body: JSON.stringify(hoursDataArray) 
    // });
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: "Orari i punës u ruajt (mock - backend endpoint i nevojshëm).", opening_hours: hoursDataArray };
  },
  fetchAllRestaurantCategoriesGlobal: async () => {
    return apiService.request('/cuisine-types/');
  },

  // --- Order Management (LIDHUR ME BACKEND) ---
  fetchRestaurantOrders: async (restaurantId) => {
    // Ky duhet të jetë një endpoint që kthen porositë vetëm për këtë restorant,
    // dhe vetëm pronari/admini duhet ta aksesojë.
    // P.sh., një custom action te RestaurantViewSet ose një OrderViewSet i filtruar.
    // Backend-i yt te OrderViewSet.get_queryset() tashmë filtron për pronarin.
    // Pra, mund të thërrasim /api/orders/ dhe backend-i do të kthejë vetëm ato relevante.
    return apiService.request(`/orders/?restaurant_id=${restaurantId}`); // Ose thjesht /orders/ nëse backend-i filtron sipas pronarit
  },
  updateOrderStatus: async (orderId, newStatus) => {
    // Ky përdor @action specifik te OrderViewSet për restorantin
    return apiService.request(`/orders/${orderId}/update-status-restaurant/`, {
      method: 'PATCH', 
      body: JSON.stringify({ status: newStatus }) 
    });
  },

  // --- Menu Management (LIDHUR ME BACKEND) ---
  fetchMenuCategories: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`);
  },
  createMenuCategory: async (categoryData, restaurantId) => { 
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`, { 
      method: 'POST', body: JSON.stringify(categoryData) 
    });
  },
  updateMenuCategory: async (categoryId, categoryData, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/${categoryId}/`, { 
      method: 'PATCH', body: JSON.stringify(categoryData) 
    });
  },
  deleteMenuCategory: async (categoryId, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/${categoryId}/`, { method: 'DELETE' });
  },
  fetchMenuItems: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-items/`);
  },
  createMenuItem: async (itemData, restaurantId) => {
    // itemData duhet të përmbajë category (ID-në e kategorisë)
    // Për image upload, shiko komentin te updateRestaurantDetails
    let payload = {...itemData};
    if (payload.image) delete payload.image; // Hiq objektin File
    // image_url_placeholder duhet të jetë fusha që pret backend-i për URL-në
    return apiService.request(`/restaurants/${restaurantId}/menu-items/`, { 
      method: 'POST', body: JSON.stringify(payload)
    });
  },
  updateMenuItem: async (itemId, itemData, restaurantId) => {
    let payload = {...itemData};
    if (payload.image) delete payload.image;
    return apiService.request(`/restaurants/${restaurantId}/menu-items/${itemId}/`, { 
      method: 'PATCH', body: JSON.stringify(payload) 
    });
  },
  deleteMenuItem: async (itemId, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-items/${itemId}/`, { method: 'DELETE' });
  },

  // --- Reviews (LIDHUR ME BACKEND - KRIJO ENDPOINT-ET) ---
  fetchReviewsForRestaurant: async (restaurantId) => {
    console.warn(`RO_API: fetchReviewsForRestaurant for ${restaurantId}. Endpoint needs implementation.`);
    // return apiService.request(`/restaurants/${restaurantId}/reviews/`); 
    await new Promise(resolve => setTimeout(resolve, 500));
    return { reviews: mockReviewsData.slice(0,2), averageRating: 4.5, ratingDistribution: {5:2,4:0,3:0,2:0,1:0} }; // Mock
  },
  submitReviewReply: async (reviewId, replyText) => {
    console.warn(`RO_API: submitReviewReply for ${reviewId}. Endpoint needs implementation.`);
    // return apiService.request(`/reviews/${reviewId}/reply/`, {
    //     method: 'POST',
    //     body: JSON.stringify({ text: replyText })
    // });
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: "Përgjigja u dërgua (mock)."};
  },

  // --- Analytics (LIDHUR ME BACKEND - KRIJO ENDPOINT-ET) ---
  fetchRestaurantAnalytics: async (restaurantId) => {
    console.warn(`RO_API: fetchRestaurantAnalytics for ${restaurantId}. Endpoint needs implementation.`);
    // return apiService.request(`/restaurants/${restaurantId}/analytics-summary/`);
    await new Promise(resolve => setTimeout(resolve, 800));
    const totalRevenueMonth = mockSalesDataMonthly.reduce((sum, item) => sum + item.total, 0);
    const totalOrdersMonth = mockSalesDataMonthly.reduce((sum, item) => sum + item.orders, 0);
    return { 
        totalRevenueMonth, totalOrdersMonth, 
        avgOrderValue: totalOrdersMonth > 0 ? totalRevenueMonth / totalOrdersMonth : 0, 
        newCustomersMonth: 33, 
        salesMonthly: mockSalesDataMonthly, 
        salesDaily: mockSalesDataDaily, 
        popularItems: mockPopularItems.slice(0,3)
    }; // Mock data
  }
};

// Mock data (vetëm për analytics dhe reviews që nuk kanë ende endpoint)
const mockSalesDataMonthly = [ { name: 'Maj', total: 6150, orders: 350 }, { name: 'Qer', total: 5600, orders: 310 },];
const mockSalesDataDaily = [ { name: 'E Shtunë', total: 900, orders: 50 }, { name: 'E Diel', total: 650, orders: 35 },];
const mockPopularItems = [ { name: 'Pizza Speciale', orders: 125, revenue: 1000 }, { name: 'Burger Deluxe', orders: 98, revenue: 1176 }];
const mockReviewsData = [{ id: 'rev1', customerName: 'Klient Test', rating: 5, comment: 'Shumë mirë!', date: new Date().toISOString(), items_ordered: ['Artikulli 1'], reply: null }];