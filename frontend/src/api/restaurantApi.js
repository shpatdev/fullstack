// src/api/restaurantApi.js
import { apiService } from './apiService.js'; // Assuming your generic helper

// Mock storages - in a real app, these don't exist here.
// These are just to make Gemini's mock functions work if copied directly.
// You will replace the function bodies with actual API calls.
let mockOrderStorage = [ /* ... (Copy from Gemini's Restaurant Owner apiService.mockOrderStorage) ... */ 
    { id: 'ORD101', restaurantId: 1, user_details: { id: 5, username: "John Doe" }, created_at: "2024-05-22T10:30:00Z", status: 'PREPARING', total_amount: "25.50", items: [ { id: 101, menu_item_details: {id: 201, name: "Pepperoni Pizza", price: "12.00"}, quantity: 2, price_at_purchase: "12.00"}, { id: 102, menu_item_details: {id: 202, name: "Cola", price: "1.50"}, quantity: 1, price_at_purchase: "1.50"} ], delivery_address_street: "123 Main St", delivery_address_city: "Pizzatown", delivery_instructions: "Ring bell twice." },
    // ... (add the rest of the mockOrderStorage from Gemini's output)
];
let mockMenuCategoriesStorage = [ /* ... (Copy from Gemini's Restaurant Owner apiService.mockMenuCategoriesStorage) ... */ 
    { id: 'CAT001', name: "Pizzas", description: "Classic and specialty pizzas", restaurantId: 1, order: 0 },
    // ... (add the rest)
];
let mockMenuItemsStorage = [ /* ... (Copy from Gemini's Restaurant Owner apiService.mockMenuItemsStorage) ... */ 
    { id: 'ITEM001', name: "Margherita Pizza", description: "Classic cheese and tomato.", price: "10.00", categoryId: 'CAT001', menuId: 'MENU001', restaurantId: 1, is_available: true, image: "https://placehold.co/100x100/f8d7da/721c24?text=Pizza" },
    // ... (add the rest)
];


export const restaurantApi = {
  getRestaurantDetails: async (restaurantId, token) => {
    console.log(`API: Fetching details for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockRestaurantsData = { /* ... (Copy from Gemini's mockRestaurantsData, ensure it's just the map) ... */ };
    return mockRestaurantsData[restaurantId] || null;
  },
  fetchRestaurantOrders: async (restaurantId, token) => {
    console.log(`API: Fetching orders for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/orders/?restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockOrderStorage.filter(o => o.restaurantId === restaurantId);
  },
  updateOrderStatus: async (orderId, newStatus, token) => {
    console.log(`API: Updating order ${orderId} to status ${newStatus}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 500));
    const orderIndex = mockOrderStorage.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      mockOrderStorage[orderIndex].status = newStatus;
      return { ...mockOrderStorage[orderIndex] };
    }
    throw new Error("Order not found in mock storage for update.");
  },
  fetchMenuCategories: async (restaurantId, token) => {
    console.log(`API: Fetching menu categories for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-categories/?restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockMenuCategoriesStorage.filter(cat => cat.restaurantId === restaurantId);
  },
  createMenuCategory: async (categoryData, token) => {
    console.log('API: Creating menu category', categoryData);
    // REAL: return apiService.request(`/menu-categories/`, { method: 'POST', body: JSON.stringify(categoryData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCategory = { ...categoryData, id: `CAT${Date.now()}` };
    mockMenuCategoriesStorage.push(newCategory);
    return newCategory;
  },
  updateMenuCategory: async (categoryId, categoryData, token) => {
    console.log(`API: Updating menu category ${categoryId}`, categoryData);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'PATCH', body: JSON.stringify(categoryData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockMenuCategoriesStorage.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      mockMenuCategoriesStorage[index] = { ...mockMenuCategoriesStorage[index], ...categoryData };
      return mockMenuCategoriesStorage[index];
    }
    throw new Error("Category not found for update.");
  },
  deleteMenuCategory: async (categoryId, token) => {
    console.log(`API: Deleting menu category ${categoryId}`);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const itemsInCategory = mockMenuItemsStorage.filter(item => item.categoryId === categoryId);
    if (itemsInCategory.length > 0) {
        throw new Error(`Cannot delete category: ${itemsInCategory.length} item(s) are using it.`);
    }
    mockMenuCategoriesStorage = mockMenuCategoriesStorage.filter(cat => cat.id !== categoryId);
    return { success: true };
  },
  fetchMenuItems: async (restaurantId, token) => {
    console.log(`API: Fetching menu items for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockMenuItemsStorage.filter(item => item.restaurantId === restaurantId);
  },
  createMenuItem: async (itemData, token) => {
    console.log('API: Creating menu item', itemData);
    // REAL: return apiService.request(`/menu-items/`, { method: 'POST', body: JSON.stringify(itemData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const newItem = { ...itemData, id: `ITEM${Date.now()}` };
    mockMenuItemsStorage.push(newItem);
    return newItem;
  },
  updateMenuItem: async (itemId, itemData, token) => {
    console.log(`API: Updating menu item ${itemId}`, itemData);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'PATCH', body: JSON.stringify(itemData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockMenuItemsStorage.findIndex(item => item.id === itemId);
    if (index !== -1) {
      mockMenuItemsStorage[index] = { ...mockMenuItemsStorage[index], ...itemData };
      return mockMenuItemsStorage[index];
    }
    throw new Error("Menu item not found for update.");
  },
  deleteMenuItem: async (itemId, token) => {
    console.log(`API: Deleting menu item ${itemId}`);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    mockMenuItemsStorage = mockMenuItemsStorage.filter(item => item.id !== itemId);
    return { success: true };
  },
};