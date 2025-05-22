// src/api/restaurantApi.js
import { apiService } from './apiService.js'; // Assuming your generic helper

// --- Mock Data Stores (Remove when connecting to real API) ---
// These are copied from Gemini's Restaurant Owner App.jsx's internal apiService
let mockRO_OrderStorage = [ 
    { id: 'ORD101', restaurantId: 1, user_details: { id: 5, username: "John Doe" }, created_at: "2024-05-22T10:30:00Z", status: 'PREPARING', total_amount: "25.50", items: [ { id: 101, menu_item_details: {id: 201, name: "Pepperoni Pizza", price: "12.00"}, quantity: 2, price_at_purchase: "12.00"}, { id: 102, menu_item_details: {id: 202, name: "Cola", price: "1.50"}, quantity: 1, price_at_purchase: "1.50"} ], delivery_address_street: "123 Main St", delivery_address_city: "Pizzatown", delivery_instructions: "Ring bell twice." },
    { id: 'ORD102', restaurantId: 2, user_details: { id: 6, username: "Jane Smith" }, created_at: "2024-05-22T11:00:00Z", status: 'CONFIRMED', total_amount: "15.75", items: [ { id: 103, menu_item_details: {id: 301, name: "Classic Burger", price: "8.00"}, quantity: 1, price_at_purchase: "8.00"}, { id: 104, menu_item_details: {id: 302, name:"Fries", price:"3.50"}, quantity:1, price_at_purchase:"3.50"} ], delivery_address_street: "456 Oak Rd", delivery_address_city: "Burgerville", delivery_instructions: null },
    { id: 'ORD103', restaurantId: 1, user_details: { id: 7, username: "Mike Johnson" }, created_at: "2024-05-22T09:15:00Z", status: 'PENDING', total_amount: "42.10", items: [ {id: 105, menu_item_details: {id: 203, name: "Margherita Pizza", price: "10.00"}, quantity: 3, price_at_purchase: "10.00"} ], delivery_address_street: "789 Pine Ln", delivery_address_city: "Pizzatown", delivery_instructions: "Beware of dog." },
    { id: 'ORD104', restaurantId: 1, user_details: { id: 8, username: "Alice Wonderland" }, created_at: "2024-05-21T18:00:00Z", status: 'DELIVERED', total_amount: "18.90", items: [ {id: 106, menu_item_details: {id: 201, name: "Pepperoni Pizza", price: "12.00"}, quantity: 1, price_at_purchase: "12.00"} ], delivery_address_street: "Wonderland Ave", delivery_address_city: "Pizzatown", delivery_instructions: "" },
    { id: 'ORD105', restaurantId: 2, user_details: { id: 9, username: "Bob The Builder" }, created_at: "2024-05-22T12:30:00Z", status: 'READY_FOR_PICKUP', total_amount: "22.00", items: [ {id:107, menu_item_details:{id:303, name:"Cheese Burger", price:"8.50"}, quantity:2, price_at_purchase:"8.50"} ], delivery_address_street: "1 Construction Site", delivery_address_city: "Burgerville", delivery_instructions: "Call upon arrival." },
    { id: 'ORD106', restaurantId: 1, user_details: { id: 10, username: "Charlie Brown" }, created_at: "2024-05-22T13:00:00Z", status: 'CANCELLED_BY_RESTAURANT', total_amount: "10.50", items: [ {id:108, menu_item_details:{id:204, name:"Garlic Bread", price:"4.50"}, quantity:1, price_at_purchase:"4.50"} ], delivery_address_street: "Peanuts St", delivery_address_city: "Pizzatown", delivery_instructions: "No peanuts please." },
];
let mockRO_MenuCategoriesStorage = [
    { id: 'CAT001', name: "Pizzas", description: "Classic and specialty pizzas", restaurantId: 1, order: 0 },
    { id: 'CAT002', name: "Pastas", description: "Delicious pasta dishes", restaurantId: 1, order: 1 },
    { id: 'CAT003', name: "Drinks", description: "Refreshing beverages", restaurantId: 1, order: 2 },
    { id: 'CAT004', name: "Burgers", description: "Juicy beef burgers", restaurantId: 2, order: 0 },
    { id: 'CAT005', name: "Sides", description: "Fries, rings, and more", restaurantId: 2, order: 1 },
];
let mockRO_MenuItemsStorage = [
    { id: 'ITEM001', name: "Margherita Pizza", description: "Classic cheese and tomato.", price: "10.00", categoryId: 'CAT001', menuId: 'MENU001', restaurantId: 1, is_available: true, image: "https://placehold.co/100x100/f8d7da/721c24?text=Pizza" },
    { id: 'ITEM002', name: "Pepperoni Pizza", description: "With spicy pepperoni.", price: "12.00", categoryId: 'CAT001', menuId: 'MENU001', restaurantId: 1, is_available: true, image: "https://placehold.co/100x100/d1ecf1/0c5460?text=Pizza" },
    { id: 'ITEM003', name: "Spaghetti Carbonara", description: "Creamy and delicious.", price: "14.00", categoryId: 'CAT002', menuId: 'MENU001', restaurantId: 1, is_available: false, image: "https://placehold.co/100x100/d4edda/155724?text=Pasta" },
    { id: 'ITEM004', name: "Classic Burger", description: "Beef patty, lettuce, tomato.", price: "8.50", categoryId: 'CAT004', menuId: 'MENU002', restaurantId: 2, is_available: true, image: "https://placehold.co/100x100/f0e68c/a0522d?text=Burger" },
];
const mockRO_RestaurantsData = { // From Gemini's Restaurant Owner App.jsx
    1: { id: 1, name: "Luigi's Pizzeria", cuisine: "Italian, Pizza", address: "123 Pizza St", phone: "555-1234", description: "Authentic Italian...", image: "https://placehold.co/300x200/007bff/white?text=Luigi's", deliveryTime: "25-35 min", priceRange: "€€", openingHours: [{day:0, open:"11:00", close:"22:00"}, {day:1, open:"11:00", close:"22:00"}, {day:2, open:"11:00", close:"22:00"}, {day:3, open:"11:00", close:"22:00"}, {day:4, open:"11:00", close:"23:00"}, {day:5, open:"12:00", close:"23:00"}, {day:6, isClosed:true}]},
    2: { id: 2, name: "Burger Palace", cuisine: "American, Burgers", address: "456 Burger Ave", phone: "555-5678", description: "Juicy burgers...", image: "https://placehold.co/300x200/28a745/white?text=Burger+Palace", deliveryTime: "20-30 min", priceRange: "€", openingHours: [{day:0, open:"10:00", close:"21:00"}, {day:1, open:"10:00", close:"21:00"}, {day:2, open:"10:00", close:"21:00"}, {day:3, open:"10:00", close:"21:00"}, {day:4, open:"10:00", close:"22:00"}, {day:5, open:"10:00", close:"22:00"}, {day:6, open:"12:00", close:"20:00"}]},
};
const mockRO_AllCuisineCategories = [
    { id: 1, name: "Italian" }, { id: 2, name: "Burgers" }, { id: 3, name: "Pizza" }, 
    { id: 4, name: "Sushi" }, { id: 5, name: "Mexican" }, { id: 6, name: "Indian" },
    { id: 7, name: "Chinese" }, { id: 8, name: "Vegan" }
];
// --- End Mock Data Stores ---


export const restaurantApi = {
  fetchRestaurantDetails: async (restaurantId, token) => {
    console.log(`RESTAURANT_API: Fetching details for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockRO_RestaurantsData[restaurantId] || null;
  },
  updateRestaurantDetails: async (restaurantId, detailsData, token) => {
    console.log(`RESTAURANT_API: Updating details for restaurant ${restaurantId}`, detailsData);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { method: 'PATCH', body: JSON.stringify(detailsData), headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, 600));
    if (mockRO_RestaurantsData[restaurantId]) {
      mockRO_RestaurantsData[restaurantId] = { ...mockRO_RestaurantsData[restaurantId], ...detailsData,
        categories: detailsData.cuisine_type_ids 
            ? detailsData.cuisine_type_ids.map(id => mockRO_AllCuisineCategories.find(c => c.id === id)).filter(Boolean)
            : mockRO_RestaurantsData[restaurantId].categories
      };
      return mockRO_RestaurantsData[restaurantId];
    }
    throw new Error("Restaurant not found for update (mock).");
  },
  setOpeningHours: async (restaurantId, hoursData, token) => {
    console.log(`RESTAURANT_API: Setting opening hours for restaurant ${restaurantId}`, hoursData);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/set_opening_hours/`, { method: 'POST', body: JSON.stringify(hoursData), headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, 600));
    if (mockRO_RestaurantsData[restaurantId]) {
      mockRO_RestaurantsData[restaurantId].opening_hours = hoursData.map((h, index) => ({
          ...h, 
          id: mockRO_RestaurantsData[restaurantId].opening_hours[index]?.id || `OH_MOCK_${Date.now()}_${index}`
      }));
      return { success: true, opening_hours: mockRO_RestaurantsData[restaurantId].opening_hours };
    }
    throw new Error("Restaurant not found for setting opening hours (mock).");
  },
  fetchAllCuisineCategories: async (token) => { // System-wide categories for selection
    console.log("RESTAURANT_API: Fetching all cuisine categories");
    // REAL: return apiService.request(`/restaurant-categories/`, { headers: { 'Authorization': `Bearer ${token}` } }); // Assuming an endpoint for this
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRO_AllCuisineCategories;
  },
  fetchRestaurantOrders: async (restaurantId, token) => {
    console.log(`RESTAURANT_API: Fetching orders for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/orders/?restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockRO_OrderStorage.filter(o => o.restaurantId === restaurantId);
  },
  updateOrderStatus: async (orderId, newStatus, token) => {
    console.log(`RESTAURANT_API: Updating order ${orderId} to status ${newStatus}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }), headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 500));
    const orderIndex = mockRO_OrderStorage.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      mockRO_OrderStorage[orderIndex].status = newStatus;
      return { ...mockRO_OrderStorage[orderIndex] };
    }
    throw new Error("Order not found in mock storage for update.");
  },
  fetchMenuCategories: async (restaurantId, token) => {
    console.log(`RESTAURANT_API: Fetching menu categories for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-categories/?restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockRO_MenuCategoriesStorage.filter(cat => cat.restaurantId === restaurantId);
  },
  createMenuCategory: async (categoryData, token) => { // categoryData should include restaurantId
    console.log('RESTAURANT_API: Creating menu category', categoryData);
    // REAL: return apiService.request(`/menu-categories/`, { method: 'POST', body: JSON.stringify(categoryData), headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCategory = { ...categoryData, id: `CAT_RO_${Date.now()}` };
    mockRO_MenuCategoriesStorage.push(newCategory);
    return newCategory;
  },
  updateMenuCategory: async (categoryId, categoryData, token) => {
    console.log(`RESTAURANT_API: Updating menu category ${categoryId}`, categoryData);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'PATCH', body: JSON.stringify(categoryData), headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockRO_MenuCategoriesStorage.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      mockRO_MenuCategoriesStorage[index] = { ...mockRO_MenuCategoriesStorage[index], ...categoryData };
      return mockRO_MenuCategoriesStorage[index];
    }
    throw new Error("Category not found for update (mock).");
  },
  deleteMenuCategory: async (categoryId, token) => {
    console.log(`RESTAURANT_API: Deleting menu category ${categoryId}`);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    const itemsInCategory = mockRO_MenuItemsStorage.filter(item => item.categoryId === categoryId);
    if (itemsInCategory.length > 0) {
        throw new Error(`Cannot delete category: ${itemsInCategory.length} item(s) are using it (mock).`);
    }
    mockRO_MenuCategoriesStorage = mockRO_MenuCategoriesStorage.filter(cat => cat.id !== categoryId);
    return { success: true };
  },
  fetchMenuItems: async (restaurantId, token) => {
    console.log(`RESTAURANT_API: Fetching menu items for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockRO_MenuItemsStorage.filter(item => item.restaurantId === restaurantId);
  },
  createMenuItem: async (itemData, token) => { // itemData should include menuId (or restaurantId for backend to find default menu)
    console.log('RESTAURANT_API: Creating menu item', itemData);
    // REAL: return apiService.request(`/menu-items/`, { method: 'POST', body: JSON.stringify(itemData), headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    const newItem = { ...itemData, id: `ITEM_RO_${Date.now()}` };
    mockRO_MenuItemsStorage.push(newItem);
    return newItem;
  },
  updateMenuItem: async (itemId, itemData, token) => {
    console.log(`RESTAURANT_API: Updating menu item ${itemId}`, itemData);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'PATCH', body: JSON.stringify(itemData), headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockRO_MenuItemsStorage.findIndex(item => item.id === itemId);
    if (index !== -1) {
      mockRO_MenuItemsStorage[index] = { ...mockRO_MenuItemsStorage[index], ...itemData };
      return mockRO_MenuItemsStorage[index];
    }
    throw new Error("Menu item not found for update (mock).");
  },
  deleteMenuItem: async (itemId, token) => {
    console.log(`RESTAURANT_API: Deleting menu item ${itemId}`);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
    await new Promise(resolve => setTimeout(resolve, 300));
    mockRO_MenuItemsStorage = mockRO_MenuItemsStorage.filter(item => item.id !== itemId);
    return { success: true };
  },
};