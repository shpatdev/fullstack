// src/api/adminApi.js
import { apiService } from './apiService.js'; // Supozojmë helper-in gjenerik

// --- Mock Data Stores (nga output-i i Admin App.jsx i Gemini-t) ---
// Hiqi këto kur të lidhesh me API-në reale.
let mockApiUsersDataForAdminPanel = [
    { id: 1, username: "johndoe", email: "john@example.com", role: "CUSTOMER", status: "ACTIVE", date_joined: "2023-01-15T10:00:00Z" },
    { id: 2, username: "janerestaurant", email: "jane@restaurant.com", role: "RESTAURANT_OWNER", status: "ACTIVE", date_joined: "2023-02-20T11:30:00Z" },
    { id: 3, username: "delivercharlie", email: "charlie@delivery.co", role: "DELIVERY_PERSONNEL", status: "SUSPENDED", date_joined: "2023-03-10T09:15:00Z" },
    { id: 4, username: "adminuser", email: "admin@fooddash.com", role: "ADMIN", status: "ACTIVE", date_joined: "2023-01-01T08:00:00Z" },
    { id: 5, username: "pendingapproval", email: "pending@example.com", role: "RESTAURANT_OWNER", status: "PENDING_APPROVAL", date_joined: "2024-05-20T12:00:00Z" },
    { id: 6, username: "owner_bob", email: "bob@owner.com", role: "RESTAURANT_OWNER", status: "ACTIVE", date_joined: "2022-11-10T08:00:00Z"},
];
let nextUserIdForAdminPanel = mockApiUsersDataForAdminPanel.length > 0 ? Math.max(...mockApiUsersDataForAdminPanel.map(u => u.id)) + 1 : 1;

let mockApiRestaurantsDataForAdminPanel = [
    { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234", image: "https://placehold.co/100x100/E81123/white?text=Pizza", categories: [{ id: 1, name: "Italian" }, {id: 2, name: "Pizza"}], owner: 2, owner_details: { id: 2, username: "janerestaurant" }, is_active: true, is_approved: true, date_created: "2023-03-01T14:00:00Z" },
    { id: 2, name: "Burger Queen", address: "456 Burger Ln", phone: "555-5678", image: "https://placehold.co/100x100/F7630C/white?text=Burger", categories: [{ id: 3, name: "Burgers" }], owner: 6, owner_details: { id: 6, username: "owner_bob" }, is_active: false, is_approved: true, date_created: "2023-04-15T10:00:00Z" },
    { id: 3, name: "Sushi Spot", address: "789 Fish Rd", phone: "555-9012", image: "https://placehold.co/100x100/0078D4/white?text=Sushi", categories: [{ id: 4, name: "Japanese" }, {id: 5, name: "Sushi"}], owner: null, owner_details: null, is_active: false, is_approved: false, date_created: "2024-05-01T09:00:00Z" },
];
let nextRestaurantIdForAdminPanel = mockApiRestaurantsDataForAdminPanel.length > 0 ? Math.max(...mockApiRestaurantsDataForAdminPanel.map(r => r.id)) + 1 : 1;

let mockRestaurantCategoriesForAdminPanel = [
    { id: 1, name: "Italian" }, { id: 2, name: "Pizza" }, { id: 3, name: "Burgers" },
    { id: 4, name: "Japanese" }, { id: 5, name: "Sushi" }, { id: 6, name: "Fast Food"}
];
let nextRestaurantCategoryIdForAdminPanel = mockRestaurantCategoriesForAdminPanel.length > 0 ? Math.max(...mockRestaurantCategoriesForAdminPanel.map(c => c.id)) + 1 : 1;
// --- Fundi i Mock Data ---

const MOCK_API_DELAY_ADMIN_PANEL = 500;

export const adminApi = {
  // --- User CRUD ---
  fetchAllUsers: async (token) => {
    console.log("ADMIN API: Fetching all users");
    // REAL: return apiService.request('/users/');
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    return Promise.resolve([...mockApiUsersDataForAdminPanel]);
  },
  createUser: async (userData, token) => {
    console.log("ADMIN API: Creating user:", userData);
    // REAL: return apiService.request('/users/', { method: 'POST', body: JSON.stringify(userData) });
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    if (mockApiUsersDataForAdminPanel.some(u => u.username === userData.username)) return Promise.reject({ message: "Username already exists (mock)." });
    if (mockApiUsersDataForAdminPanel.some(u => u.email === userData.email)) return Promise.reject({ message: "Email already exists (mock)." });
    const newUser = { id: nextUserIdForAdminPanel++, ...userData, date_joined: new Date().toISOString() };
    mockApiUsersDataForAdminPanel.push(newUser);
    return Promise.resolve(newUser);
  },
  updateUser: async (userId, userData, token) => {
    console.log("ADMIN API: Updating user:", userId, userData);
    // REAL: return apiService.request(`/users/${userId}/`, { method: 'PATCH', body: JSON.stringify(userData) });
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    const userIndex = mockApiUsersDataForAdminPanel.findIndex(u => u.id === userId);
    if (userIndex === -1) return Promise.reject({ message: "User not found (mock)." });
    mockApiUsersDataForAdminPanel[userIndex] = { ...mockApiUsersDataForAdminPanel[userIndex], ...userData };
    return Promise.resolve(mockApiUsersDataForAdminPanel[userIndex]);
  },
  deleteUser: async (userId, token) => {
    console.log("ADMIN API: Deleting user:", userId);
    // REAL: return apiService.request(`/users/${userId}/`, { method: 'DELETE' });
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    mockApiUsersDataForAdminPanel = mockApiUsersDataForAdminPanel.filter(u => u.id !== userId);
    return Promise.resolve({ message: "User deleted (mock)" });
  },

  // --- Restaurant CRUD ---
  fetchAllRestaurants: async (token) => {
    console.log("ADMIN API: Fetching all restaurants");
    // REAL: return apiService.request('/restaurants/');
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL + 100));
    return Promise.resolve(mockApiRestaurantsDataForAdminPanel.map(r => {
        const owner = mockApiUsersDataForAdminPanel.find(u => u.id === r.owner);
        return { ...r, owner_details: owner ? { id: owner.id, username: owner.username, email: owner.email } : null };
    }));
  },
  fetchPotentialOwners: async (token) => {
    console.log("ADMIN API: Fetching potential owners");
    // REAL: return apiService.request('/users/?role__in=RESTAURANT_OWNER,ADMIN');
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL - 200));
    return Promise.resolve(
        mockApiUsersDataForAdminPanel
            .filter(u => u.role === "RESTAURANT_OWNER" || u.role === "ADMIN")
            .map(u => ({ id: u.id, username: u.username, email: u.email }))
    );
  },
  createRestaurant: async (restaurantData, token) => {
    console.log("ADMIN API: Creating restaurant:", restaurantData);
    // REAL: return apiService.request('/restaurants/', { method: 'POST', body: JSON.stringify(restaurantData) });
    // restaurantData should include: name, address, phone, owner (ID), is_active, is_approved, category_ids (array of category PKs)
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    
    let processedCategories = [];
    if (restaurantData.categories_text) { // Assuming categories_text is passed from form
        processedCategories = restaurantData.categories_text.split(',')
            .map(name => name.trim()).filter(name => name)
            .map(name => {
                let existingCat = mockRestaurantCategoriesForAdminPanel.find(c => c.name.toLowerCase() === name.toLowerCase());
                if (!existingCat) {
                    existingCat = { id: nextRestaurantCategoryIdForAdminPanel++, name: name };
                    mockRestaurantCategoriesForAdminPanel.push(existingCat);
                }
                return existingCat;
            });
    }
    
    const newRestaurant = {
        id: nextRestaurantIdForAdminPanel++,
        name: restaurantData.name,
        address: restaurantData.address,
        phone: restaurantData.phone || null,
        image: restaurantData.image || null,
        owner: restaurantData.owner || null,
        is_active: restaurantData.is_active !== undefined ? restaurantData.is_active : true,
        is_approved: restaurantData.is_approved !== undefined ? restaurantData.is_approved : false,
        categories: processedCategories, // For mock, store the objects
        owner_details: restaurantData.owner ? mockApiUsersDataForAdminPanel.find(u => u.id === restaurantData.owner) : null,
        date_created: new Date().toISOString(),
    };
    mockApiRestaurantsDataForAdminPanel.push(newRestaurant);
    return Promise.resolve(newRestaurant);
  },
  updateRestaurant: async (restaurantId, restaurantData, token) => {
    console.log("ADMIN API: Updating restaurant:", restaurantId, restaurantData);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { method: 'PATCH', body: JSON.stringify(restaurantData) });
    if (!token) return Promise.reject({ message: "Admin not authenticated." });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_ADMIN_PANEL));
    const resIndex = mockApiRestaurantsDataForAdminPanel.findIndex(r => r.id === restaurantId);
    if (resIndex === -1) return Promise.reject({ message: "Restaurant not found (mock)." });

    let processedCategories;
    if (restaurantData.categories_text !== undefined) {
        processedCategories = restaurantData.categories_text.split(',')
            .map(name => name.trim()).filter(name => name)
            .map(name => {
                let existingCat = mockRestaurantCategoriesForAdminPanel.find(c => c.name.toLowerCase() === name.toLowerCase());
                if (!existingCat) {
                    existingCat = { id: nextRestaurantCategoryIdForAdminPanel++, name: name };
                    mockRestaurantCategoriesForAdminPanel.push(existingCat);
                }
                return existingCat;
            });
    }

    const updatedRestaurant = { ...mockApiRestaurantsDataForAdminPanel[resIndex], ...restaurantData };
    if (restaurantData.hasOwnProperty('owner')) {
        updatedRestaurant.owner_details = restaurantData.owner ? mockApiUsersDataForAdminPanel.find(u => u.id === restaurantData.owner) : null;
    }
    if (processedCategories !== undefined) {
        updatedRestaurant.categories = processedCategories;
    }
    
    mockApiRestaurantsDataForAdminPanel[resIndex] = updatedRestaurant;
    return Promise.resolve(mockApiRestaurantsDataForAdminPanel[resIndex]);
  },
  // deleteRestaurant: async (restaurantId, token) => { /* ... */ },

  // Placeholder for fetching all restaurant categories (global ones)
  fetchAllRestaurantCategories: async (token) => {
    console.log("ADMIN API: Fetching all global restaurant categories");
    // REAL: return apiService.request('/restaurant-categories/'); // Assuming global endpoint
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockRestaurantCategoriesForAdminPanel];
  }
};