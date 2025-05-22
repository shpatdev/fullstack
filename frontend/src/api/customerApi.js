// src/api/customerApi.js
import { apiService } from './apiService.js';

// Mock data (ensure it's comprehensive enough for your needs)
const mockRestaurantsDb = [
    { id: 1, name: "Luigi's Pizzeria (Mock API)", address: "123 Pizza St", image: "https://placehold.co/600x400/FACC15/78350F?text=Luigi's", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], is_active: true, is_approved: true, average_rating: 4.5, delivery_time_estimate: "25-35 min" },
    { id: 2, name: "Burger Queen (Mock API)", address: "456 Burger Ave", image: "https://placehold.co/600x400/FB923C/7C2D12?text=BurgerQ", categories: [{ id: 3, name: "Burgers" }, { id: 4, name: "Fast Food" }], is_active: true, is_approved: true, average_rating: 4.2, delivery_time_estimate: "20-30 min" },
    { id: 3, name: "Sushi Express (Mock API)", address: "789 Roll Blvd", image: "https://placehold.co/600x400/A3E635/365314?text=SushiX", categories: [{ id: 5, name: "Japanese" }, { id: 6, name: "Sushi" }], is_active: true, is_approved: true, average_rating: 4.7, delivery_time_estimate: "30-40 min" },
];

const mockRestaurantDetailsDb = {
    1: { id: 1, name: "Luigi's Pizzeria (Mock API Detail)", address: "123 Pizza St", phone: "555-1234", image: "https://placehold.co/1200x400/FACC15/78350F?text=Luigi's+Detail", categories: [{ id: 1, name: "Italian" }, { id: 2, name: "Pizza" }], description: "Authentic Italian pizza from our mock API.", opening_hours: [{ day_of_week: 0, open_time: "11:00:00", close_time: "22:00:00", is_closed: false }, { day_of_week: 1, open_time: "11:00:00", close_time: "22:00:00", is_closed: false }] },
    2: { id: 2, name: "Burger Queen (Mock API Detail)", address: "456 Burger Ave", phone: "555-5678", image: "https://placehold.co/1200x400/FB923C/7C2D12?text=BurgerQ+Detail", categories: [{ id: 3, name: "Burgers" }], description: "Juicy burgers from our mock API.", opening_hours: [{ day_of_week: 0, open_time: "10:00:00", close_time: "23:00:00", is_closed: false }] },
    3: { id: 3, name: "Sushi Express (Mock API Detail)", address: "789 Roll Blvd", phone: "555-7890", image: "https://placehold.co/1200x400/A3E635/365314?text=SushiX+Detail", categories: [{ id: 5, name: "Japanese" }], description: "Fresh sushi from our mock API.", opening_hours: [{ day_of_week: 1, open_time: "12:00:00", close_time: "22:00:00", is_closed: false }] },
};

const mockMenusDb = {
    1: [
        { id: 101, menu: 1, name: "Margherita (API Menu)", description: "Classic cheese and tomato.", price: "8.99", category: { id: 5, name: "Pizzas", restaurant: 1 }, image: "https://placehold.co/150x150/FFD700/A52A2A?text=Margherita", is_available: true, restaurant_id_placeholder: 1 },
        { id: 102, menu: 1, name: "Pepperoni (API Menu)", description: "Spicy pepperoni.", price: "10.50", category: { id: 5, name: "Pizzas", restaurant: 1 }, image: "https://placehold.co/150x150/FF8C00/A52A2A?text=Pepperoni", is_available: true, restaurant_id_placeholder: 1 },
        { id: 103, menu: 1, name: "Coke (API)", description: "Refreshing Coca-Cola.", price: "1.50", category: { id: 6, name: "Drinks", restaurant: 1 }, image: "https://placehold.co/150x150/CCCCCC/000000?text=Coke", is_available: true, restaurant_id_placeholder: 1 }
    ],
    2: [
        { id: 201, menu: 2, name: "Queen Burger (API Menu)", description: "Double patty, special sauce.", price: "9.99", category: { id: 8, name: "Burgers", restaurant: 2 }, image: "https://placehold.co/150x150/FFA07A/800000?text=Queen+Burger", is_available: true, restaurant_id_placeholder: 2 },
        { id: 202, menu: 2, name: "Fries (API)", description: "Crispy golden fries.", price: "2.99", category: { id: 9, name: "Sides", restaurant: 2 }, image: "https://placehold.co/150x150/F0E68C/A0522D?text=Fries", is_available: true, restaurant_id_placeholder: 2 }
    ],
    3: [
        { id: 301, menu: 3, name: "Salmon Nigiri Set (API Menu)", description: "Fresh salmon.", price: "12.00", category: { id: 10, name: "Nigiri", restaurant: 3 }, image: "https://placehold.co/150x150/ADD8E6/00008B?text=Salmon+Nigiri", is_available: true, restaurant_id_placeholder: 3 },
        { id: 302, menu: 3, name: "Miso Soup (API)", description: "Traditional Japanese soup.", price: "3.50", category: { id: 11, name: "Soups", restaurant: 3 }, image: "https://placehold.co/150x150/DEB887/8B4513?text=Miso", is_available: true, restaurant_id_placeholder: 3 }
    ],
};

let mockUserAddresses = [
    { id: 1, street: "123 Main St", city: "Anytown", zip_code: "12345", country: "USA", is_default_shipping: true, user_id: 1 },
    { id: 2, street: "456 Oak Ave", city: "Otherville", zip_code: "67890", country: "USA", is_default_shipping: false, user_id: 1 },
];
let nextAddressId = 3;

let mockUserOrders = [
    // Ensure items structure matches what OrderHistoryItem expects
    { id: 'ORDER-MOCK-1A2B3C', restaurant: 1, restaurant_details: { name: "Luigi's Pizzeria (Mock API)" }, created_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), total_amount: "25.50", status: "Delivered", items: [{ menu_item_name_at_purchase: "Pepperoni Pizza", quantity: 1, price_at_purchase: "10.50"}, { menu_item_name_at_purchase: "Coke", quantity: 2, price_at_purchase: "1.50"}], user_id: 1 },
    { id: 'ORDER-MOCK-4D5E6F', restaurant: 2, restaurant_details: { name: "Burger Queen (Mock API)" }, created_at: new Date(Date.now() - 1 * 60 * 60000).toISOString(), total_amount: "15.75", status: "Preparing", items: [{ menu_item_name_at_purchase: "Queen Burger", quantity: 1, price_at_purchase: "9.99"}, { menu_item_name_at_purchase: "Fries", quantity: 1, price_at_purchase: "2.99"}], user_id: 1 },
];


export const customerApi = {
  fetchActiveRestaurants: async () => {
    console.log('CUSTOMER API (Mock): Fetching active restaurants');
    // REAL API Call:
    // return apiService.request('/restaurants/?is_active=true&is_approved=true');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockRestaurantsDb.filter(r => r.is_active && r.is_approved);
  },

  fetchRestaurantById: async (restaurantId) => {
    console.log(`CUSTOMER API (Mock): Fetching restaurant by ID: ${restaurantId}`);
    // REAL API Call:
    // return apiService.request(`/restaurants/${restaurantId}/`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const found = mockRestaurantDetailsDb[parseInt(restaurantId)];
    if (found) return found;
    throw new Error(`Restaurant with ID ${restaurantId} not found (mock API).`);
  },

  fetchMenuItemsForRestaurant: async (restaurantId) => {
    console.log(`CUSTOMER API (Mock): Fetching menu items for restaurant ID: ${restaurantId}`);
    // REAL: return apiService.request(`/menu-items/?menu__restaurant_id=${restaurantId}&is_available=true`);
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockMenusDb[parseInt(restaurantId)] || [];
  },

   fetchUserCart: async () => {
    console.log('CUSTOMER API (Mock): Fetching user cart');
    // REAL: return apiService.request('/carts/');
    await new Promise(resolve => setTimeout(resolve, 400));
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
        const mockUserIdStr = localStorage.getItem('mockUserId');
        const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;

        const currentMockCartItems = JSON.parse(localStorage.getItem(`mockCustomerCartItems_${mockUserId}`) || '[]');
        const totalAmount = currentMockCartItems.reduce((sum, item) => sum + parseFloat(item.menu_item_details.price) * item.quantity, 0);
        return {
            id: `CART_CUST_${mockUserId || 'GUEST'}`,
            user: mockUserId,
            items: currentMockCartItems,
            total_amount: totalAmount.toFixed(2)
        };
    }
    return { id: null, user: null, items: [], total_amount: "0.00" };
  },

  addItemToCart: async (menuItemId, quantity, menuItemDetails) => {
    console.log(`CUSTOMER API (Mock): Adding item ${menuItemId} (qty: ${quantity}) to cart`);
    // REAL: return apiService.request('/cart-items/', { method: 'POST', body: JSON.stringify({ menu_item: menuItemId, quantity }) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;

    const cartKey = `mockCustomerCartItems_${mockUserId}`;
    const currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existingItemIndex = currentMockCartItems.findIndex(item => item.menu_item === menuItemId);

    if (existingItemIndex > -1) {
        currentMockCartItems[existingItemIndex].quantity += quantity;
    } else {
        currentMockCartItems.push({
            id: `CART_ITEM_${Date.now()}`, // Mock cart item ID
            cart: `CART_CUST_${mockUserId || 'GUEST'}`,
            menu_item: menuItemId, // This is the MenuItem's actual ID
            quantity: quantity,
            menu_item_details: { ...menuItemDetails } // Store full details for easy display
        });
    }
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return { success: true, message: "Item added (mock API)" };
  },

   updateCartItemQuantity: async (cartItemId, newQuantity) => {
    console.log(`CUSTOMER API (Mock): Updating cart item ${cartItemId} to quantity ${newQuantity}`);
    // REAL: return apiService.request(`/cart-items/${cartItemId}/`, { method: 'PATCH', body: JSON.stringify({ quantity: newQuantity }) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;
    const cartKey = `mockCustomerCartItems_${mockUserId}`;

    let currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (newQuantity <= 0) {
        currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    } else {
        const itemIndex = currentMockCartItems.findIndex(item => item.id === cartItemId);
        if (itemIndex > -1) {
            currentMockCartItems[itemIndex].quantity = newQuantity;
        }
    }
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return { success: true, message: "Quantity updated (mock API)" };
  },

  removeCartItem: async (cartItemId) => {
    console.log(`CUSTOMER API (Mock): Removing cart item ${cartItemId}`);
    // REAL: return apiService.request(`/cart-items/${cartItemId}/`, { method: 'DELETE' });
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;
    const cartKey = `mockCustomerCartItems_${mockUserId}`;

    let currentMockCartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
    currentMockCartItems = currentMockCartItems.filter(item => item.id !== cartItemId);
    localStorage.setItem(cartKey, JSON.stringify(currentMockCartItems));
    return { success: true, message: "Item removed (mock API)" };
  },

  fetchUserAddresses: async () => {
    console.log('CUSTOMER API (Mock): Fetching user addresses');
    // REAL: return apiService.request('/addresses/'); // Filtered by user on backend
    await new Promise(resolve => setTimeout(resolve, 600));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;
    return mockUserAddresses.filter(addr => addr.user_id === mockUserId);
  },

  createUserAddress: async (addressData) => {
    console.log('CUSTOMER API (Mock): Creating user address', addressData);
    // REAL: return apiService.request('/addresses/', { method: 'POST', body: JSON.stringify(addressData) });
    await new Promise(resolve => setTimeout(resolve, 400));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;

    const newAddress = { ...addressData, id: nextAddressId++, is_default_shipping: addressData.is_default_shipping || false, user_id: mockUserId };
    if (newAddress.is_default_shipping) {
        mockUserAddresses = mockUserAddresses.map(addr => addr.user_id === mockUserId ? {...addr, is_default_shipping: false} : addr);
    }
    mockUserAddresses.push(newAddress);
    return newAddress;
  },

  createOrder: async (orderData) => {
    console.log('CUSTOMER API (Mock): Creating order', orderData);
    // REAL: return apiService.request('/orders/', { method: 'POST', body: JSON.stringify(orderData) });
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;
    const userDetailsFromStorage = JSON.parse(localStorage.getItem('mockUserDetails') || '{}');
    const cartKey = `mockCustomerCartItems_${mockUserId}`;
    const cartItemsForTotal = JSON.parse(localStorage.getItem(cartKey) || '[]');


    const newOrderId = `ORDER-MOCK-${Date.now().toString().slice(-6).toUpperCase()}`;
    const newOrder = {
        id: newOrderId,
        restaurant: orderData.restaurant, // Restaurant ID
        restaurant_details: { name: mockRestaurantDetailsDb[orderData.restaurant]?.name || `Restaurant ${orderData.restaurant} (Mock)` },
        user_details: { username: userDetailsFromStorage.name || 'Mock Customer' }, // This should come from AuthContext.user
        created_at: new Date().toISOString(),
        status: 'PENDING',
        total_amount: cartItemsForTotal.reduce((sum, item) => {
            const price = parseFloat(item.menu_item_details.price) || 0;
            return sum + price * item.quantity;
        }, 0).toFixed(2),
        items: cartItemsForTotal.map(item => ({
            menu_item_name_at_purchase: item.menu_item_details.name,
            quantity: item.quantity,
            price_at_purchase: parseFloat(item.menu_item_details.price).toFixed(2) // Ensure price is stored
        })),
        delivery_address_street: orderData.delivery_address_street,
        delivery_address_city: orderData.delivery_address_city,
        delivery_address_zip_code: orderData.delivery_address_zip_code,
        delivery_address_country: orderData.delivery_address_country,
        estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
        user_id: mockUserId
    };
    mockUserOrders.push(newOrder);
    localStorage.removeItem(cartKey); // Clear mock cart for the user
    return newOrder;
  },

  fetchUserOrders: async () => {
    console.log('CUSTOMER API (Mock): Fetching user orders');
    // REAL: return apiService.request('/orders/'); // Filtered by user on backend via token
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockUserIdStr = localStorage.getItem('mockUserId');
    const mockUserId = mockUserIdStr ? parseInt(mockUserIdStr) : null;
    return mockUserOrders.filter(order => order.user_id === mockUserId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
};