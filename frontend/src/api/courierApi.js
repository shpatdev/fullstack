// src/api/courierApi.js
import { apiService } from './apiService.js';

// Mock data stores from Gemini's Driver App.jsx
// These should be removed once real API calls are made.
let MOCK_AGENT_DETAILS_DRIVER = { /* ... copy from Gemini ... */ 
    id: 'agentProfile001', name: "Alex Green", email: "driver@example.com", isOnline: false,
};
let MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER = [ /* ... copy from Gemini ... */ 
    { id: 201, restaurant_details: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234" }, delivery_address_street: "456 Oak Ave", delivery_address_city: "Townsville", delivery_address_zip_code: "12345", delivery_instructions: "Ring bell twice.", total_amount: "25.50", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Margherita Pizza", quantity: 1 }, { menu_item_name_at_purchase: "Coke", quantity: 2 } ] },
    // ... more tasks ...
    { id: 204, restaurant_details: { id: 1, name: "Luigi's Pizzeria" }, delivery_address_street: "999 Test Rd", delivery_address_city: "Testville", total_amount: "30.00", status: "CONFIRMED", driver: 'agentProfile001', items: [ { menu_item_name_at_purchase: "Pepperoni Special", quantity: 1 } ] },
];
const MOCK_DELIVERY_HISTORY_DATA_API_FORMAT_DRIVER = [ /* ... copy from Gemini ... */ 
    { id: 101, restaurant_details: { name: "Burger Palace" }, user_details: { username: "Old Customer" }, delivered_time: "2024-05-20T10:00:00Z", total_amount: "4.50", status: "DELIVERED" },
    // ... more history ...
];


export const courierApi = {
  loginDeliveryAgent: async (credentials) => {
    console.log('DRIVER API: Logging in with', credentials);
    // REAL: return apiService.request('/token/', { method: 'POST', body: JSON.stringify(credentials) }); // Or a specific driver login endpoint
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    if (credentials.email === 'driver@example.com' && credentials.password === 'password') {
      MOCK_AGENT_DETAILS_DRIVER.isOnline = false; // Reset on new login for demo
      return { token: 'fake-jwt-token-driver', agentDetails: { ...MOCK_AGENT_DETAILS_DRIVER } };
    }
    throw new Error('Invalid driver credentials (mock).');
  },
  getAgentProfile: async (token) => { // Assuming token implies which agent
    console.log('DRIVER API: Fetching agent profile');
    // REAL: return apiService.request('/driver-profiles/me/', { headers: { 'Authorization': `Bearer ${token}` } }); // Example endpoint
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...MOCK_AGENT_DETAILS_DRIVER };
  },
  updateAgentAvailability: async (agentId, newStatus, token) => {
    console.log(`DRIVER API: Agent ${agentId} availability to ${newStatus}`);
    // REAL: return apiService.request(`/driver-profiles/${agentId}/availability/`, { method: 'PATCH', body: JSON.stringify({ is_online: newStatus }), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 300));
    MOCK_AGENT_DETAILS_DRIVER.isOnline = newStatus;
    return { success: true, isOnline: newStatus };
  },
  getAvailableDeliveryTasks: async (token) => {
    console.log("DRIVER API: Fetching available tasks");
    // REAL: return apiService.request('/orders/?status=READY_FOR_PICKUP&driver__isnull=true', { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 700));
    const available = JSON.parse(JSON.stringify(MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER.filter(t => t.status === 'READY_FOR_PICKUP' && t.driver === null)));
    return available;
  },
  getCurrentActiveTask: async (agentProfileId, token) => {
    console.log(`DRIVER API: Fetching current active task for ${agentProfileId}`);
    // REAL: return apiService.request(`/orders/?driver_id=${agentProfileId}&status__in=CONFIRMED,PREPARING,ON_THE_WAY`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const activeStatuses = ["CONFIRMED", "PICKED_UP", "ON_THE_WAY"]; 
    const task = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER.find(
        t => t.driver === agentProfileId && activeStatuses.includes(t.status)
    );
    return task ? [task] : [];
  },
  acceptTask: async (orderId, driverProfileId, token) => {
    console.log(`DRIVER API: Driver ${driverProfileId} accepting task ${orderId}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ driver: driverProfileId, status: "CONFIRMED" }), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER.findIndex(t => t.id === orderId && t.status === 'READY_FOR_PICKUP' && t.driver === null);
    if (taskIndex > -1) {
      MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex].status = 'CONFIRMED'; 
      MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex].driver = driverProfileId;
      return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex] };
    }
    throw new Error('Task not available or already accepted (mock).');
  },
  updateOrderStatus: async (orderId, newStatusRequest, token) => { // newStatusRequest e.g., "PICKED_UP"
    console.log(`DRIVER API: Updating order ${orderId} to status ${newStatusRequest}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatusRequest }), headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 500));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER.findIndex(t => t.id === orderId);
    if (taskIndex > -1) {
        MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex].status = newStatusRequest;
        return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_DRIVER[taskIndex] };
    }
    throw new Error("Order not found for status update (mock).");
  },
  getAgentDeliveryHistory: async (agentProfileId, token) => {
    console.log(`DRIVER API: Fetching delivery history for ${agentProfileId}`);
    // REAL: return apiService.request(`/orders/?driver_id=${agentProfileId}&status__in=DELIVERED,CANCELLED_BY_DRIVER,CANCELLED_BY_USER`, { headers: { 'Authorization': `Bearer ${token}` } });
    // Mock:
    await new Promise(resolve => setTimeout(resolve, 600));
    // This mock returns global history, a real API would filter by agentProfileId
    return [...MOCK_DELIVERY_HISTORY_DATA_API_FORMAT_DRIVER];
  },
};