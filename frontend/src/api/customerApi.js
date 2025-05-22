// src/api/customerApi.js
import { apiService } from './apiService.js';

// Mock data (remove when using real API)
let mockUserAddresses = [
    { id: 1, street: "123 Main St", city: "Anytown", zip_code: "12345", country: "USA", is_default_shipping: true },
    { id: 2, street: "456 Oak Ave", city: "Otherville", zip_code: "67890", country: "USA", is_default_shipping: false },
];
let nextAddressId = 3;

let mockUserOrders = [
    { id: 'ORDER-1A2B3C', restaurant_details: { name: "Luigi's Pizzeria" }, created_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), total_amount: "25.50", status: "Delivered", items: [{ menu_item_name_at_purchase: "Pepperoni Pizza", quantity: 1}, { menu_item_name_at_purchase: "Coke", quantity: 2}]},
    { id: 'ORDER-4D5E6F', restaurant_details: { name: "Burger Queen" }, created_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(), total_amount: "15.75", status: "Preparing", items: [{ menu_item_name_at_purchase: "Queen Burger", quantity: 1}, { menu_item_name_at_purchase: "Fries", quantity: 1}] },
];
let nextOrderIdPart = 7;


export const customerApi = {
  fetchActiveRestaurants: async () => {
    console.log('CUSTOMER API: Fetching active restaurants');
    // REAL: return apiService.request('/restaurants/?is_active=true&is_approved=true');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [ /* ... (Copy mock restaurant list from Gemini's customerApi output) ... */ 
        { id: 1, name: "Luigi's Pizzeria (API List)", address: "123 Pizza St", image: "https://placehold.co/600x400/FACC15/78350F?text=Luigi's+API", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], is_active: true, is_approved: true, average_rating: 4.5, delivery_time_estimate: "25-35 min" },
        { id: 2, name: "Burger Queen (API List)", address: "456 Burger Ave", image: "https://placehold.co/600x400/FB923C/7C2D12?text=BurgerQ+API", categories: [{ id: 3, name: "Burgers" }, { id: 4, name: "Fast Food" }], is_active: true, is_approved: true, average_rating: 4.2, delivery_time_estimate: "20-30 min" },
        { id: 3, name: "Sushi Express (API List)", address: "789 Roll Blvd", image: "https://placehold.co/600x400/A3E635/365314?text=SushiX+API", categories: [{ id: 5, name: "Japanese" }, { id: 6, name: "Sushi" }], is_active: true, is_approved: true, average_rating: 4.7, delivery_time_estimate: "30-40 min" },
    ];
  },
  fetchRestaurantById: async (restaurantId) => {
    console.log(`CUSTOMER API: Fetching restaurant by ID: ${restaurantId}`);
    // REAL: return apiService.request(`/restaurants/${restaurantId}/`);
    await new Promise(resolve => setTimeout(resolve, 500));
     const mockRestaurantsDb = [ /* ... (Copy mock restaurant details from Gemini's customerApi output) ... */ 
        { id: 1, name: "Luigi's Pizzeria (API Detail)", address: "123 Pizza St", phone: "555-1234", image: "https://placehold.co/1200x400/FACC15/78350F?text=Luigi's+Detail", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], description: "Authentic Italian pizza from API.", opening_hours: [{ day_of_week: 0, open_time: "11:00:00", close_time: "22:00:00", is_closed: false }] },
        { id: 2, name: "Burger Queen (API Detail)", address: "456 Burger Ave", phone: "555-5678", image: "https://placehold.co/1200x400/FB923C/7C2D12?text=BurgerQ+Detail", categories: [{ id: 3, name: "Burgers" }], description: "Juicy burgers from API.", opening_hours: [{ day_of_week: 0, open_time: "10:00:00", close_time: "23:00:00", is_closed: false }] },
        { id: 3, name: "Sushi Express (API Detail)", address: "789 Roll Blvd", phone: "555-7890", image: "https://placehold.co/1200x400/A3E635/365314?text=SushiX+Detail", categories: [{ id: 5, name: "Japanese" }], description: "Fresh sushi from API.", opening_hours: [{ day_of_week: 1, open_time: "12:00:00", close_time: "22:00:00", is_closed: false }] },
    ];
    const found = mockRestaurantsDb.find(r => r.id === parseInt(restaurantId));
    if (found) return found;
    throw new Error(`Restaurant with ID ${restaurantId} not found (mock API).`);
  },
  fetchMenuItemsForRestaurant: async (restaurantId) => {
    console.log(`CUSTOMER API: Fetching menu items for restaurant ID: ${restaurantId}`);
    // REAL: return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}&is_available=true`);
    await new Promise(resolve => setTimeout(resolve, 700));
    const mockMenusDb = { /* ... (Copy mock menu items from Gemini's customerApi output) ... */ 
        1: [ { id: 101, menu: 1, name: "Margherita (API Menu)", description: "Classic cheese and tomato.", price: "8.99", category: { id: 5, name: "Pizzas", restaurant: 1 }, image: "https://placehold.co/150x150/FFD700/A52A2A?text=Margherita", is_available: true }, { id: 102, menu: 1, name: "Pepperoni (API Menu)", description: "Spicy pepperoni.", price: "10.50", category: { id: 5, name: "Pizzas", restaurant: 1 }, image: "https://placehold.co/150x150/FF8C00/A52A2A?text=Pepperoni", is_available: true } ],
        2: [ { id: 201, menu: 2, name: "Queen Burger (API Menu)", description: "Double patty, special sauce.", price: "9.99", category: { id: 8, name: "Burgers", restaurant: 2 }, image: "https://placehold.co/150x150/FFA07A/800000?text=Queen+Burger", is_available: true } ],
        3: [ { id: 301, menu: 3, name: "Salmon Nigiri Set (API Menu)", description: "Fresh salmon.", price: "12.00", category: { id: 10, name: "Nigiri", restaurant: 3 }, image: "https://placehold.co/150x150/ADD8E6/00008B?text=Salmon+Nigiri", is_available: true } ],
    };
    return mockMenusDb[restaurantId] || [];
  },
  fetchUserCart: async () => { 
    console.log('CUSTOMER API: Fetching user cart');
    // REAL: return apiService.request('/carts/'); // Token handled by apiService
    await new Promise(resolve => setTimeout(resolve, 400));
    if (localStorage.getItem('accessToken')) { // Simulate cart only for logged-in users
        // Retrieve from mock localStorage for cart items for demo persistence
        const currentMockCartItems = JSON.parse(localStorage.getItem('mockCustomerCartItems') || '[]');
        const totalAmount = currentMockCartItems.reduce((sum, item) => sum + parseFloat(item.menu_item_details.price) * item.quantity, 0);
        return {
            id: 'CART_CUST_001', // Mock Cart ID
            user: JSON.parse(localStorage.getItem('authUser'))?.id || null, // Mock User ID
            items: currentMockCartItems,
            total_amount: totalAmount.toFixed(2)
        };
    }
    return { id: null, user: null, items: [], total_amount: "0.00" };
  },
  addItemToCart: async (menuItemId, quantity, menuItemDetails) => { 
    console.log(`CUSTOMER API: Adding item ${menuItemId} (qty: ${quantity}) to cart`);
    // REAL: return apiService.request('/cart-items/', { method: 'POST', body: JSON.stringify({ menu_item: menuItemId, quantity }) });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simulate adding to mock localStorage cart
    const currentMockCartItems = JSON.parse(localStorage.getItem('mockCustomerCartItems') || '[]');
    const existingItemIndex = currentMockCartItems.findIndex(item => item.menu_item === menuItemId);
    if (existingItemIndex > -1) {
        currentMockCartItems[existingItemIndex].quantity += quantity;
    } else {
        currentMockCartItems.push({ 
            id: `CART_ITEM_${Date.now()}`, // Mock cart item ID
            cart: 'CART_CUST_001', 
            menu_item: menuItemId, 
            quantity: quantity,
            menu_item_details: { ...menuItemDetails } // Store full details for easy display
        });
    }
    localStorage.setItem('mockCustomerCartItems', JSON.stringify(currentMockCartItems));
    return { success: true, message: "Item added (mock API)" }; 
  },
   updateCartItemQuantity: async (cartItemId, newQuantity) => {
    console.log(`CUSTOMER API: Updating cart item ${cartItemId} to quantity ${newQuantity}`);
    // REAL: return apiService.request(`/cart-items/${cartItemId}/`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let currentMockCartItems = JSON.parse(localStorage.getItem('mockCustomerCartItems') || '[]');
    if (newQuantity <= 0) { 
        currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    } else {
        const itemIndex = currentMockCartItems.findIndex(item => item.id === cartItemId);
        if (itemIndex > -1) {
            currentMockCartItems[itemIndex].quantity = newQuantity;
        }
    }
    localStorage.setItem('mockCustomerCartItems', JSON.stringify(currentMockCartItems));
    return { success: true, message: "Quantity updated (mock API)" };
  },
  removeCartItem: async (cartItemId) => {
    console.log(`CUSTOMER API: Removing cart item ${cartItemId}`);
    // REAL: return apiService.request(`/cart-items/${cartItemId}/`, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, 300));
    let currentMockCartItems = JSON.parse(localStorage.getItem('mockCustomerCartItems') || '[]');
    currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    localStorage.setItem('mockCustomerCartItems', JSON.stringify(currentMockCartItems));
    return { success: true, message: "Item removed (mock API)" };
  },
  fetchUserAddresses: async () => {
    console.log('CUSTOMER API: Fetching user addresses');
    // REAL: return apiService.request('/addresses/'); // Filtered by user on backend
    await new Promise(resolve => setTimeout(resolve, 600));
    return [...mockUserAddresses]; // Return a copy
  },
  createUserAddress: async (addressData) => {
    console.log('CUSTOMER API: Creating user address', addressData);
    // REAL: return apiService.request('/addresses/', { method: 'POST', body: JSON.stringify(addressData) });
    await new Promise(resolve => setTimeout(resolve, 400));
    const newAddress = { ...addressData, id: nextAddressId++, is_default_shipping: addressData.is_default_shipping || false };
    mockUserAddresses.push(newAddress);
    if (newAddress.is_default_shipping) { // Ensure only one default
        mockUserAddresses = mockUserAddresses.map(addr => addr.id === newAddress.id ? newAddress : {...addr, is_default_shipping: false});
    }
    return newAddress;
  },
  createOrder: async (orderData) => {
    console.log('CUSTOMER API: Creating order', orderData);
    // REAL: return apiService.request('/orders/', { method: 'POST', body: JSON.stringify(orderData) });
    await new Promise(resolve => setTimeout(resolve, 1200));
    const newOrderId = `ORDER-${Date.now().toString().slice(-6).toUpperCase()}`;
    const newOrder = {
        id: newOrderId,
        restaurant: orderData.restaurant, // Should be restaurant ID
        restaurant_details: { name: `Restaurant ${orderData.restaurant}` }, // Mock
        user_details: { username: JSON.parse(localStorage.getItem('authUser'))?.username || 'Customer' },
        created_at: new Date().toISOString(),
        status: 'PENDING', // Initial status
        total_amount: orderData.items.reduce((sum, item) => sum + (item.price_at_order || parseFloat(item.menu_item_details?.price || 0)) * item.quantity, 0).toFixed(2), // Simulate total calculation
        items: orderData.items.map(item => ({ // Transform items to match order history display
            menu_item_name_at_purchase: `Item ${item.menu_item}`, // Placeholder
            quantity: item.quantity
        })),
        estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString()
    };
    mockUserOrders.push(newOrder);
    localStorage.removeItem('mockCustomerCartItems'); // Clear mock cart
    return newOrder;
  },
  fetchUserOrders: async () => {
    console.log('CUSTOMER API: Fetching user orders');
    // REAL: return apiService.request('/orders/'); // Filtered by user on backend
    await new Promise(resolve => setTimeout(resolve, 800));
    return [...mockUserOrders]; // Return a copy
  }
};