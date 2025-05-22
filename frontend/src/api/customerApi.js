// src/api/customerApi.js
import { apiService } from './apiService.js'; // Assuming a central apiService helper

export const customerApi = {
  fetchActiveRestaurants: async () => {
    console.log('API: Fetching active restaurants');
    // REAL API CALL:
    // return apiService.request('/restaurants/?is_active=true&is_approved=true');
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        { id: 1, name: "Luigi's Pizzeria Real API", address: "123 Pizza St", image: "https://placehold.co/600x400/FACC15/78350F?text=Luigi's+API", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], is_active: true, is_approved: true },
        { id: 2, name: "Burger Queen Real API", address: "456 Burger Ave", image: "https://placehold.co/600x400/FB923C/7C2D12?text=BurgerQ+API", categories: [{ id: 3, name: "Burgers" }, { id: 4, name: "Fast Food" }], is_active: true, is_approved: true },
        { id: 3, name: "Sushi Express Real API", address: "789 Roll Blvd", image: "https://placehold.co/600x400/A3E635/365314?text=SushiX+API", categories: [{ id: 5, name: "Japanese" }, { id: 6, name: "Sushi" }], is_active: true, is_approved: true },
    ];
  },
  fetchRestaurantById: async (restaurantId) => {
    console.log(`API: Fetching restaurant by ID: ${restaurantId}`);
    // REAL API CALL:
    // return apiService.request(`/restaurants/${restaurantId}/`);

    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 500));
     const mockRestaurantsDb = [
        { id: 1, name: "Luigi's Pizzeria (API Detail)", address: "123 Pizza St", phone: "555-1234", image: "https://placehold.co/1200x400/FACC15/78350F?text=Luigi's+Detail", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], description: "Authentic Italian pizza from API.", opening_hours: [{ day_of_week: 0, open_time: "11:00:00", close_time: "22:00:00", is_closed: false }] },
        { id: 2, name: "Burger Queen (API Detail)", address: "456 Burger Ave", phone: "555-5678", image: "https://placehold.co/1200x400/FB923C/7C2D12?text=BurgerQ+Detail", categories: [{ id: 3, name: "Burgers" }], description: "Juicy burgers from API.", opening_hours: [{ day_of_week: 0, open_time: "10:00:00", close_time: "23:00:00", is_closed: false }] },
        { id: 3, name: "Sushi Express (API Detail)", address: "789 Roll Blvd", phone: "555-7890", image: "https://placehold.co/1200x400/A3E635/365314?text=SushiX+Detail", categories: [{ id: 5, name: "Japanese" }], description: "Fresh sushi from API.", opening_hours: [{ day_of_week: 1, open_time: "12:00:00", close_time: "22:00:00", is_closed: false }] },
    ];
    const found = mockRestaurantsDb.find(r => r.id === parseInt(restaurantId));
    if (found) return found;
    throw new Error(`Restaurant with ID ${restaurantId} not found (mock API).`);
  },
  fetchMenuItemsForRestaurant: async (restaurantId) => {
    console.log(`API: Fetching menu items for restaurant ID: ${restaurantId}`);
    // REAL API CALL:
    // return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}&is_available=true`);

    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 700));
    const mockMenusDb = {
        1: [ { id: 101, menu: 1, name: "Margherita (API)", description: "Classic cheese and tomato.", price: "8.99", category: { id: 5, name: "Pizzas" }, image: "https://placehold.co/150x150/FFD700/A52A2A?text=Margherita", is_available: true }, { id: 102, menu: 1, name: "Pepperoni (API)", description: "Spicy pepperoni.", price: "10.50", category: { id: 5, name: "Pizzas" }, image: "https://placehold.co/150x150/FF8C00/A52A2A?text=Pepperoni", is_available: true } ],
        2: [ { id: 201, menu: 2, name: "Queen Burger (API)", description: "Double patty, special sauce.", price: "9.99", category: { id: 8, name: "Burgers" }, image: "https://placehold.co/150x150/FFA07A/800000?text=Queen+Burger", is_available: true } ],
        3: [ { id: 301, menu: 3, name: "Salmon Nigiri Set (API)", description: "Fresh salmon.", price: "12.00", category: { id: 10, name: "Nigiri" }, image: "https://placehold.co/150x150/ADD8E6/00008B?text=Salmon+Nigiri", is_available: true } ],
    };
    return mockMenusDb[restaurantId] || [];
  },
  fetchUserCart: async () => {
    console.log('API: Fetching user cart');
    // REAL API CALL: Token is handled by apiService.request
    // return apiService.request('/carts/');
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 400));
    if (localStorage.getItem('accessToken')) { // Simulate cart only for logged-in users
        return {
            id: 1, user: 1, 
            items: [
                { id: 1, cart: 1, menu_item: 101, quantity: 1, menu_item_details: { id: 101, name: "Margherita Pizza (Cart API)", price: "8.99", image: "https://placehold.co/100x100/FFD700/A52A2A?text=Margherita" } },
            ],
        };
    }
    return { id: null, user: null, items: [] };
  },
  addItemToCart: async (menuItemId, quantity) => {
    console.log(`API: Adding item ${menuItemId} (qty: ${quantity}) to cart`);
    // REAL API CALL: Token is handled by apiService.request
    // return apiService.request('/cart-items/', { method: 'POST', body: JSON.stringify({ menu_item: menuItemId, quantity }) });
    
    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: "Item added (mock API)", createdCartItem: { id: Date.now(), menu_item: menuItemId, quantity, menu_item_details: { id: menuItemId, name: `Mock Item ${menuItemId}`, price: "9.99" } } }; 
  },
   updateCartItemQuantity: async (cartItemId, quantity) => {
    console.log(`API: Updating cart item ${cartItemId} to quantity ${quantity}`);
    // REAL API CALL:
    // return apiService.request(`/cart-items/${cartItemId}/`, { method: 'PATCH', body: JSON.stringify({ quantity }) });

    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    if (quantity <= 0) { 
        return customerApi.removeCartItem(cartItemId);
    }
    return { success: true, message: "Quantity updated (mock API)", updatedCartItem: { id: cartItemId, quantity } };
  },
  removeCartItem: async (cartItemId) => {
    console.log(`API: Removing cart item ${cartItemId}`);
    // REAL API CALL:
    // return apiService.request(`/cart-items/${cartItemId}/`, { method: 'DELETE' });

    // Mock from Gemini:
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: "Item removed (mock API)" };
  },
};