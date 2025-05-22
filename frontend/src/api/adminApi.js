// src/api/adminApi.js
import { apiService } from './apiService.js'; // Assuming your generic helper

// Mock data stores from Gemini's Admin App.jsx
// Remove these when connecting to real API
let mockApiUsersDataAdmin = [ /* ... copy from Gemini ... */ 
    { id: 1, username: "johndoe", email: "john@example.com", role: "CUSTOMER", status: "ACTIVE", date_joined: "2023-01-15T10:00:00Z" },
    // ... more users
];
let nextUserIdAdmin = mockApiUsersDataAdmin.length > 0 ? Math.max(...mockApiUsersDataAdmin.map(u => u.id)) + 1 : 1;

let mockApiRestaurantsDataAdmin = [ /* ... copy from Gemini ... */ 
    { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234", image: "https://placehold.co/100x100/E81123/white?text=Pizza", categories: [{ id: 1, name: "Italian" }, {id: 2, name: "Pizza"}], owner: 2, owner_details: { id: 2, username: "janerestaurant" }, is_active: true, is_approved: true, date_created: "2023-03-01T14:00:00Z" },
    // ... more restaurants
];
let nextRestaurantIdAdmin = mockApiRestaurantsDataAdmin.length > 0 ? Math.max(...mockApiRestaurantsDataAdmin.map(r => r.id)) + 1 : 1;


export const adminApi = {
  // --- User CRUD ---
  fetchAllUsers: async (token) => {
    console.log("ADMIN API: Fetching all users");
    // REAL: return apiService.request('/users/', { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockApiUsersDataAdmin];
  },
  createUser: async (userData, token) => {
    console.log("ADMIN API: Creating user:", userData);
    // REAL: return apiService.request('/users/', { method: 'POST', body: JSON.stringify(userData), headers: { 'Authorization': `Bearer ${token}` } }); 
    // OR /api/register/ if it handles admin creation with role
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    if (mockApiUsersDataAdmin.some(u => u.username === userData.username)) throw new Error("Username already exists (mock).");
    if (mockApiUsersDataAdmin.some(u => u.email === userData.email)) throw new Error("Email already exists (mock).");
    const newUser = { id: nextUserIdAdmin++, ...userData, date_joined: new Date().toISOString() };
    mockApiUsersDataAdmin.push(newUser);
    return newUser;
  },
  updateUser: async (userId, userData, token) => {
    console.log("ADMIN API: Updating user:", userId, userData);
    // REAL: return apiService.request(`/users/${userId}/`, { method: 'PATCH', body: JSON.stringify(userData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const userIndex = mockApiUsersDataAdmin.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found (mock).");
    // Add unique checks for username/email if being updated
    mockApiUsersDataAdmin[userIndex] = { ...mockApiUsersDataAdmin[userIndex], ...userData };
    return mockApiUsersDataAdmin[userIndex];
  },
  deleteUser: async (userId, token) => {
    console.log("ADMIN API: Deleting user:", userId);
    // REAL: return apiService.request(`/users/${userId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    mockApiUsersDataAdmin = mockApiUsersDataAdmin.filter(u => u.id !== userId);
    return { message: "User deleted (mock)" };
  },

  // --- Restaurant CRUD ---
  fetchAllRestaurants: async (token) => {
    console.log("ADMIN API: Fetching all restaurants");
    // REAL: return apiService.request('/restaurants/', { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockApiRestaurantsDataAdmin.map(r => {
        if (r.owner && !r.owner_details) {
            const owner = mockApiUsersDataAdmin.find(u => u.id === r.owner);
            return { ...r, owner_details: owner ? { id: owner.id, username: owner.username } : null };
        }
        return r;
    });
  },
  fetchPotentialOwners: async (token) => {
    console.log("ADMIN API: Fetching potential owners");
    // REAL: return apiService.request('/users/?role__in=RESTAURANT_OWNER,ADMIN', { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockApiUsersDataAdmin
        .filter(u => u.role === "RESTAURANT_OWNER" || u.role === "ADMIN")
        .map(u => ({ id: u.id, username: u.username, email: u.email }));
  },
  createRestaurant: async (restaurantData, token) => {
    console.log("ADMIN API: Creating restaurant:", restaurantData);
    // REAL: return apiService.request('/restaurants/', { method: 'POST', body: JSON.stringify(restaurantData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const newRestaurant = { id: nextRestaurantIdAdmin++, ...restaurantData, date_created: new Date().toISOString(), owner_details: restaurantData.owner ? mockApiUsersDataAdmin.find(u=>u.id === restaurantData.owner) : null };
    mockApiRestaurantsDataAdmin.push(newRestaurant);
    return newRestaurant;
  },
  updateRestaurant: async (restaurantId, restaurantData, token) => {
    console.log("ADMIN API: Updating restaurant:", restaurantId, restaurantData);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`, { method: 'PATCH', body: JSON.stringify(restaurantData), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const resIndex = mockApiRestaurantsDataAdmin.findIndex(r => r.id === restaurantId);
    if (resIndex === -1) throw new Error("Restaurant not found (mock).");
    mockApiRestaurantsDataAdmin[resIndex] = { ...mockApiRestaurantsDataAdmin[resIndex], ...restaurantData, owner_details: restaurantData.owner ? mockApiUsersDataAdmin.find(u=>u.id === restaurantData.owner) : mockApiRestaurantsDataAdmin[resIndex].owner_details };
    if (restaurantData.hasOwnProperty('owner') && restaurantData.owner === null) {
        mockApiRestaurantsDataAdmin[resIndex].owner_details = null;
    }
    return mockApiRestaurantsDataAdmin[resIndex];
  },
  // deleteRestaurant: async (restaurantId, token) => { /* ... */ },
};