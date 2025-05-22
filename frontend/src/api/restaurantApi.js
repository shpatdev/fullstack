// src/api/restaurantApi.js
import { apiService } from './apiService.js'; // Supozojmë helper-in gjenerik

// --- Mock Data Stores ---
let mockRO_OrderStorage = [ 
    { id: 'ORD101', restaurantId: 1, user_details: { id: 5, username: "John Doe" }, created_at: "2024-05-23T10:30:00Z", status: 'PREPARING', total_amount: "25.50", items: [ { id: 'ITEM_ORD_1', menu_item_details: {id: 'ITEM001', name: "Pepperoni Pizza", price: "12.00"}, quantity: 2, price_at_purchase: "12.00"}, { id: 'ITEM_ORD_2', menu_item_details: {id: 'ITEM_DRINK', name: "Cola", price: "1.50"}, quantity: 1, price_at_purchase: "1.50"} ], delivery_address_street: "123 Main St", delivery_address_city: "Pizzatown", delivery_instructions: "Ring bell twice." },
    { id: 'ORD102', restaurantId: 2, user_details: { id: 6, username: "Jane Smith" }, created_at: "2024-05-23T11:00:00Z", status: 'CONFIRMED', total_amount: "15.75", items: [ { id: 'ITEM_ORD_3', menu_item_details: {id: 'ITEM004', name: "Classic Burger", price: "8.00"}, quantity: 1, price_at_purchase: "8.00"}, { id: 'ITEM_ORD_4', menu_item_details: {id: 'ITEM_SIDE', name:"Fries", price:"3.50"}, quantity:1, price_at_purchase:"3.50"} ], delivery_address_street: "456 Oak Rd", delivery_address_city: "Burgerville", delivery_instructions: null },
    { id: 'ORD103', restaurantId: 1, user_details: { id: 7, username: "Mike Johnson" }, created_at: "2024-05-23T09:15:00Z", status: 'PENDING', total_amount: "42.10", items: [ {id: 'ITEM_ORD_5', menu_item_details: {id: 'ITEM001', name: "Margherita Pizza", price: "10.00"}, quantity: 3, price_at_purchase: "10.00"} ], delivery_address_street: "789 Pine Ln", delivery_address_city: "Pizzatown", delivery_instructions: "Beware of dog." },
];
let mockRO_MenuCategoriesStorage = [
    { id: 'CAT001', name: "Pizzas", description: "Classic and specialty pizzas", restaurantId: 1, order: 0 },
    { id: 'CAT002', name: "Pastas", description: "Delicious pasta dishes", restaurantId: 1, order: 1 },
    { id: 'CAT003', name: "Drinks", description: "Refreshing beverages", restaurantId: 1, order: 2 },
    { id: 'CAT004', name: "Burgers", description: "Juicy beef burgers", restaurantId: 2, order: 0 },
    { id: 'CAT005', name: "Sides", description: "Fries, rings, and more", restaurantId: 2, order: 1 },
];
let nextRO_MenuCategoryID = 6;

let mockRO_MenuItemsStorage = [
    { id: 'ITEM001', name: "Margherita Pizza", description: "Classic cheese and tomato.", price: "10.00", categoryId: 'CAT001', menuId: 'MENU001', restaurantId: 1, is_available: true, image: "https://placehold.co/100x100/f8d7da/721c24?text=Pizza" },
    { id: 'ITEM002', name: "Pepperoni Pizza", description: "With spicy pepperoni.", price: "12.00", categoryId: 'CAT001', menuId: 'MENU001', restaurantId: 1, is_available: true, image: "https://placehold.co/100x100/d1ecf1/0c5460?text=Pizza" },
    { id: 'ITEM003', name: "Spaghetti Carbonara", description: "Creamy and delicious.", price: "14.00", categoryId: 'CAT002', menuId: 'MENU001', restaurantId: 1, is_available: false, image: "https://placehold.co/100x100/d4edda/155724?text=Pasta" },
    { id: 'ITEM004', name: "Classic Burger", description: "Beef patty, lettuce, tomato.", price: "8.50", categoryId: 'CAT004', menuId: 'MENU002', restaurantId: 2, is_available: true, image: "https://placehold.co/100x100/f0e68c/a0522d?text=Burger" },
];
let nextRO_MenuItemID = 5;

const mockRO_RestaurantsDataForSettings = { 
    1: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St, Pizzatown", phone: "555-0101", image: "https://placehold.co/300x200/007bff/white?text=Luigi's", description: "Authentic Italian pizzeria serving the best pies in town. Family recipes passed down through generations, using only the freshest ingredients.", cuisine_type_ids: [1, 3], categories: [ { id: 1, name: "Italian"}, { id: 3, name: "Pizza"} ], opening_hours: [ { id: 'OH001', day_of_week: 0, open_time: "11:00", close_time: "22:00", is_closed: false }, { id: 'OH002', day_of_week: 1, open_time: "11:00", close_time: "22:00", is_closed: false }, { id: 'OH003', day_of_week: 2, open_time: "11:00", close_time: "22:00", is_closed: false }, { id: 'OH004', day_of_week: 3, open_time: "11:00", close_time: "22:00", is_closed: false }, { id: 'OH005', day_of_week: 4, open_time: "11:00", close_time: "23:00", is_closed: false }, { id: 'OH006', day_of_week: 5, open_time: "12:00", close_time: "23:00", is_closed: false }, { id: 'OH007', day_of_week: 6, open_time: "12:00", close_time: "21:00", is_closed: true }, ], deliveryTime: "25-35 min", priceRange: "€€", },
    2: { id: 2, name: "Burger Palace", address: "456 Burger Ave, Grillville", phone: "555-0202", image: "https://placehold.co/300x200/28a745/white?text=Burger+Palace", description: "Juicy burgers, crispy fries, and thick milkshakes. Your go-to for American classics. We use 100% Angus beef.", cuisine_type_ids: [2], categories: [ { id: 2, name: "Burgers"} ], opening_hours: [ { id: 'OH008', day_of_week: 0, open_time: "10:00", close_time: "21:00", is_closed: false }, { id: 'OH009', day_of_week: 1, open_time: "10:00", close_time: "21:00", is_closed: false }, { id: 'OH010', day_of_week: 2, open_time: "10:00", close_time: "21:00", is_closed: false }, { id: 'OH011', day_of_week: 3, open_time: "10:00", close_time: "21:00", is_closed: false }, { id: 'OH012', day_of_week: 4, open_time: "10:00", close_time: "22:00", is_closed: false }, { id: 'OH013', day_of_week: 5, open_time: "10:00", close_time: "22:00", is_closed: false }, { id: 'OH014', day_of_week: 6, open_time: "12:00", close_time: "20:00", is_closed: false }, ], deliveryTime: "20-30 min", priceRange: "€", },
};
const mockRO_AllGlobalRestaurantCategories = [ // Këto janë RestaurantCategory globale
      { id: 1, name: "Italian" }, { id: 2, name: "Burgers" }, { id: 3, name: "Pizza" }, 
      { id: 4, name: "Sushi" }, { id: 5, name: "Mexican" }, { id: 6, name: "Indian" },
];
// --- Fundi i Mock Data ---

const MOCK_API_DELAY_RO = 500;

export const restaurantApi = {
  fetchRestaurantDetails: async (restaurantId, token) => {
    console.log(`RO_API: Fetching details for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const restaurant = mockRO_RestaurantsDataForSettings[restaurantId];
    if (restaurant) {
      const populatedRestaurant = {
        ...restaurant,
        // Sigurohu që backend-i kthen kategoritë e restorantit (jo të menuve)
        // Kjo supozon se `cuisine_type_ids` është në `restaurantData` dhe `mockRO_AllGlobalRestaurantCategories` është i disponueshëm
        categories: (restaurant.cuisine_type_ids || []).map(id => 
            mockRO_AllGlobalRestaurantCategories.find(c => c.id === id)
        ).filter(Boolean)
      };
      return populatedRestaurant;
    }
    return null;
  },

  updateRestaurantDetails: async (restaurantId, detailsData, token) => {
    console.log(`RO_API: Updating details for restaurant ${restaurantId}`, detailsData);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { 
    //          method: 'PATCH', 
    //          body: JSON.stringify(detailsData) // detailsData duhet të përmbajë vetëm fushat që ndryshojnë
    //       });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO + 100));
    if (mockRO_RestaurantsDataForSettings[restaurantId]) {
      mockRO_RestaurantsDataForSettings[restaurantId] = {
        ...mockRO_RestaurantsDataForSettings[restaurantId],
        ...detailsData,
        categories: detailsData.category_ids // Supozojmë se detailsData.category_ids është një array ID-sh
            ? detailsData.category_ids.map(id => mockRO_AllGlobalRestaurantCategories.find(c => c.id === id)).filter(Boolean)
            : mockRO_RestaurantsDataForSettings[restaurantId].categories
      };
      return { ...mockRO_RestaurantsDataForSettings[restaurantId] };
    }
    throw new Error("Restaurant not found for update (mock).");
  },

  setOpeningHours: async (restaurantId, hoursDataArray, token) => {
    console.log(`RO_API: Setting opening hours for restaurant ${restaurantId}`, hoursDataArray);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/set_opening_hours/`, { 
    //          method: 'POST', 
    //          body: JSON.stringify(hoursDataArray) 
    //       });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO + 100));
    if (mockRO_RestaurantsDataForSettings[restaurantId]) {
      mockRO_RestaurantsDataForSettings[restaurantId].opening_hours = hoursDataArray.map((h, index) => ({
          ...h, 
          id: mockRO_RestaurantsDataForSettings[restaurantId].opening_hours?.find(oh => oh.day_of_week === h.day_of_week)?.id || `OH_MOCK_RO_${Date.now()}_${index}`
      }));
      return { success: true, opening_hours: mockRO_RestaurantsDataForSettings[restaurantId].opening_hours };
    }
    throw new Error("Restaurant not found for setting opening hours (mock).");
  },

  fetchAllRestaurantCategoriesGlobal: async (token) => {
    console.log("RO_API: Fetching all global cuisine categories");
    // REAL: return apiService.request(`/restaurant-categories/`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO - 200));
    return [...mockRO_AllGlobalRestaurantCategories];
  },

  fetchRestaurantOrders: async (restaurantId, token) => {
    console.log(`RO_API: Fetching orders for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/orders/?restaurant_id=${restaurantId}`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    return mockRO_OrderStorage.filter(o => o.restaurantId === restaurantId);
  },

  updateOrderStatus: async (orderId, newStatus, token) => {
    console.log(`RO_API: Updating order ${orderId} to status ${newStatus}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const orderIndex = mockRO_OrderStorage.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      mockRO_OrderStorage[orderIndex].status = newStatus;
      return { ...mockRO_OrderStorage[orderIndex] };
    }
    throw new Error("Order not found in mock storage for update.");
  },

  fetchMenuCategories: async (restaurantId, token) => { // Këto janë MenuCategory specifike për restorant
    console.log(`RO_API: Fetching menu categories for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-categories/?restaurant_id=${restaurantId}`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO - 100));
    return mockRO_MenuCategoriesStorage.filter(cat => cat.restaurantId === restaurantId);
  },

  createMenuCategory: async (categoryData, token) => { // categoryData duhet të përmbajë restaurantId
    console.log('RO_API: Creating menu category', categoryData);
    // REAL: return apiService.request(`/menu-categories/`, { method: 'POST', body: JSON.stringify(categoryData) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const newCategory = { ...categoryData, id: `CAT_RO_${nextRO_MenuCategoryID++}` }; // Përdor ID unike
    mockRO_MenuCategoriesStorage.push(newCategory);
    return newCategory;
  },

  updateMenuCategory: async (categoryId, categoryData, token) => {
    console.log(`RO_API: Updating menu category ${categoryId}`, categoryData);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'PATCH', body: JSON.stringify(categoryData) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const index = mockRO_MenuCategoriesStorage.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      mockRO_MenuCategoriesStorage[index] = { ...mockRO_MenuCategoriesStorage[index], ...categoryData };
      return mockRO_MenuCategoriesStorage[index];
    }
    throw new Error("Category not found for update (mock).");
  },

  deleteMenuCategory: async (categoryId, token) => {
    console.log(`RO_API: Deleting menu category ${categoryId}`);
    // REAL: return apiService.request(`/menu-categories/${categoryId}/`, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const itemsInCategory = mockRO_MenuItemsStorage.filter(item => item.categoryId === categoryId);
    if (itemsInCategory.length > 0) {
        throw new Error(`Cannot delete category: ${itemsInCategory.length} item(s) are using it (mock).`);
    }
    mockRO_MenuCategoriesStorage = mockRO_MenuCategoriesStorage.filter(cat => cat.id !== categoryId);
    return { success: true };
  },

  fetchMenuItems: async (restaurantId, token) => {
    console.log(`RO_API: Fetching menu items for restaurant ${restaurantId}`);
    // REAL: return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}`); // Ose filtri yt specifik
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO + 100));
    return mockRO_MenuItemsStorage.filter(item => item.restaurantId === restaurantId);
  },

  createMenuItem: async (itemData, token) => { 
    // itemData duhet të përmbajë: name, description, price, categoryId, menuId, is_available, image, restaurantId
    console.log('RO_API: Creating menu item', itemData);
    // REAL: return apiService.request(`/menu-items/`, { method: 'POST', body: JSON.stringify(itemData) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const newItem = { ...itemData, id: `ITEM_RO_${nextRO_MenuItemID++}` }; // Përdor ID unike
    mockRO_MenuItemsStorage.push(newItem);
    return newItem;
  },

  updateMenuItem: async (itemId, itemData, token) => {
    console.log(`RO_API: Updating menu item ${itemId}`, itemData);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'PATCH', body: JSON.stringify(itemData) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    const index = mockRO_MenuItemsStorage.findIndex(item => item.id === itemId);
    if (index !== -1) {
      mockRO_MenuItemsStorage[index] = { ...mockRO_MenuItemsStorage[index], ...itemData };
      return mockRO_MenuItemsStorage[index];
    }
    throw new Error("Menu item not found for update (mock).");
  },
  
  deleteMenuItem: async (itemId, token) => {
    console.log(`RO_API: Deleting menu item ${itemId}`);
    // REAL: return apiService.request(`/menu-items/${itemId}/`, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_RO));
    mockRO_MenuItemsStorage = mockRO_MenuItemsStorage.filter(item => item.id !== itemId);
    return { success: true };
  },
};