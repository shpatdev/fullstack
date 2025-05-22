// src/api/courierApi.js
import { apiService } from './apiService.js'; // Assuming your generic helper

// --- Mock Data Stores (from Gemini's Driver App.jsx) ---
// These should be removed when connecting to real API.
// These are module-level variables, so they persist across calls in this mock setup.
let MOCK_AGENT_DETAILS_FOR_COURIER = {
  id: 'agentProfile001', // This should be the DriverProfile ID from your backend
  name: "Alex Green",
  email: "driver@example.com", // This is likely the User's email
  isOnline: false, 
};

let MOCK_PUBLIC_POOL_TASKS_FOR_COURIER = [
  { id: 201, restaurant_details: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234" }, delivery_address_street: "456 Oak Ave", delivery_address_city: "Townsville", delivery_instructions: "Ring bell twice.", total_amount: "25.50", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Margherita Pizza", quantity: 1 }, { menu_item_name_at_purchase: "Coke", quantity: 2 } ] },
  { id: 202, restaurant_details: { id: 2, name: "Sushi World", address: "789 Sushi Ln", phone: "555-sushi" }, delivery_address_street: "321 Apt Rd", delivery_address_city: "Foodville", delivery_instructions: "Leave at door.", total_amount: "35.70", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Sushi Platter Deluxe", quantity: 1 }, { menu_item_name_at_purchase: "Miso Soup", quantity: 1 } ] },
  { id: 203, restaurant_details: { id: 3, name: "Burger Palace", address: "456 Burger Blvd", phone: "555-burg" }, delivery_address_street: "789 Oak St", delivery_address_city: "Townsville", delivery_instructions: null, total_amount: "18.90", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Classic Burger", quantity: 2 }, { menu_item_name_at_purchase: "Fries", quantity: 1 } ] },
  { id: 204, restaurant_details: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234" }, delivery_address_street: "999 Test Rd", delivery_address_city: "Testville", delivery_instructions: "Call upon arrival.", total_amount: "30.00", status: "CONFIRMED", driver: 'agentProfile001', items: [ { menu_item_name_at_purchase: "Pepperoni Special", quantity: 1 } ] },
];
const MOCK_DELIVERY_HISTORY_FOR_COURIER = [ 
  { id: 101, restaurant_details: { name: "Burger Palace" }, user_details: { username: "Old Customer" }, delivered_time: "2024-05-20T10:00:00Z", total_amount: "4.50", status: "DELIVERED" },
  { id: 102, restaurant_details: { name: "Pizza Place" }, user_details: { username: "Another Cust." }, delivered_time: "2024-05-19T14:30:00Z", total_amount: "5.10", status: "DELIVERED" },
  { id: 103, restaurant_details: { name: "Sushi Spot" }, user_details: { username: "Sushi Fan" }, delivered_time: "2024-05-18T18:00:00Z", total_amount: "0.00", status: "CANCELLED_BY_USER" },
];
// --- End Mock Data ---

const MOCK_API_DELAY = 500; //ms

export const courierApi = {
  loginDriver: async (credentials) => { // Renamed for clarity
    console.log('COURIER_API: Logging in driver with', credentials);
    // REAL: return apiService.request('/token/', { method: 'POST', body: JSON.stringify(credentials) });
    // Ensure backend returns agent-specific data or role to differentiate
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    if (credentials.email === 'driver@example.com' && credentials.password === 'password') {
      MOCK_AGENT_DETAILS_FOR_COURIER.isOnline = false; // Reset on login for demo
      return { token: 'fake-jwt-token-driver', agentDetails: { ...MOCK_AGENT_DETAILS_FOR_COURIER } };
    }
    throw new Error('Invalid driver credentials (mock).');
  },
  getAgentProfile: async (token) => {
    console.log('COURIER_API: Fetching agent profile');
    // REAL: return apiService.request('/driver-profiles/me/', { headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    return { ...MOCK_AGENT_DETAILS_FOR_COURIER }; // Return a copy
  },
  updateAgentAvailability: async (driverProfileId, newStatus, token) => {
    console.log(`COURIER_API: Agent ${driverProfileId} availability to ${newStatus}`);
    // REAL: return apiService.request(`/driver-profiles/${driverProfileId}/`, { method: 'PATCH', body: JSON.stringify({ is_available: newStatus }), headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    if (MOCK_AGENT_DETAILS_FOR_COURIER.id === driverProfileId) {
        MOCK_AGENT_DETAILS_FOR_COURIER.isOnline = newStatus;
    }
    return { success: true, isOnline: newStatus };
  },
  getAvailableTasks: async (token) => {
    console.log("COURIER_API: Fetching available tasks");
    // REAL: return apiService.request('/orders/?status=READY_FOR_PICKUP&driver__isnull=true', { headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const available = JSON.parse(JSON.stringify(MOCK_PUBLIC_POOL_TASKS_FOR_COURIER.filter(t => t.status === 'READY_FOR_PICKUP' && t.driver === null)));
    return available;
  },
  getCurrentActiveTask: async (driverProfileId, token) => {
    console.log(`COURIER_API: Fetching current active task for driver ${driverProfileId}`);
    // REAL: return apiService.request(`/orders/?driver=${driverProfileId}&status__in=CONFIRMED,PREPARING,ON_THE_WAY`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Note: 'PREPARING' might be a restaurant status, driver active tasks might start from 'CONFIRMED' by driver or 'ON_THE_WAY'
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const activeStatuses = ["CONFIRMED", "PICKED_UP", "ON_THE_WAY"]; 
    const task = MOCK_PUBLIC_POOL_TASKS_FOR_COURIER.find(
        t => t.driver === driverProfileId && activeStatuses.includes(t.status)
    );
    return task ? [task] : []; // Return as array
  },
  acceptTask: async (orderId, driverProfileId, token) => { 
    console.log(`COURIER_API: Driver ${driverProfileId} accepting task ${orderId}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ driver: driverProfileId, status: "CONFIRMED" /* Or appropriate next status */ }), headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_FOR_COURIER.findIndex(t => t.id === orderId && t.status === 'READY_FOR_PICKUP' && t.driver === null);
    if (taskIndex > -1) {
      MOCK_PUBLIC_POOL_TASKS_FOR_COURIER[taskIndex].status = 'CONFIRMED'; 
      MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex].driver = driverProfileId;
      return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex] }; 
    }
    throw new Error('Task not available or already accepted (mock).');
  },
  updateOrderStatus: async (orderId, newBackendStatus, token) => { 
    console.log(`COURIER_API: Updating order ${orderId} to status ${newBackendStatus}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newBackendStatus }), headers: { 'Authorization': `Bearer ${token}` } });
     await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER.findIndex(t => t.id === orderId);
    if (taskIndex > -1) {
        MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex].status = newBackendStatus;
        return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex] };
    }
    throw new Error('Order not found for status update (mock).');
  },
  getAgentDeliveryHistory: async (driverProfileId, token) => { 
    console.log(`COURIER_API: Fetching delivery history for ${driverProfileId}`);
    // REAL: return apiService.request(`/orders/?driver=${driverProfileId}&status__in=DELIVERED,CANCELLED_BY_USER,CANCELLED_BY_RESTAURANT,CANCELLED_BY_DRIVER,FAILED`, { headers: { 'Authorization': `Bearer ${token}` } });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
    // For mock, return global history; a real API would filter.
    return [...MOCK_DELIVERY_HISTORY_FOR_COURIER]; 
  },
};