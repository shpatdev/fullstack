// src/api/courierApi.js
import { apiService } from './apiService.js'; // Supozojmë helper-in gjenerik

// --- Mock Data Stores (nga output-i i Driver App.jsx i Gemini-t) ---
// Këto duhet të hiqen kur të lidhesh me API-në reale.
// Këto janë variabla të nivelit të modulit, kështu që ruajnë gjendjen ndërmjet thirrjeve në këtë setup mock.
let MOCK_AGENT_DETAILS_FOR_DRIVER = {
  id: 'agentProfile001', // Ky duhet të jetë ID-ja e DriverProfile nga backend-i yt
  name: "Alex Green",
  email: "driver@example.com", // Ky ka gjasa të jetë email-i i User-it
  isOnline: false, 
  role: 'DRIVER' // Shto rolin për ProtectedRoute
};

let MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER = [
  { id: 201, restaurant_details: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234" }, delivery_address_street: "456 Oak Ave", delivery_address_city: "Townsville", delivery_instructions: "Ring bell twice.", total_amount: "25.50", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Margherita Pizza", quantity: 1 }, { menu_item_name_at_purchase: "Coke", quantity: 2 } ] },
  { id: 202, restaurant_details: { id: 2, name: "Sushi World", address: "789 Sushi Ln", phone: "555- sushi" }, delivery_address_street: "321 Apt Rd", delivery_address_city: "Foodville", delivery_instructions: "Leave at door.", total_amount: "35.70", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Sushi Platter Deluxe", quantity: 1 }, { menu_item_name_at_purchase: "Miso Soup", quantity: 1 } ] },
  { id: 203, restaurant_details: { id: 3, name: "Burger Palace", address: "456 Burger Blvd", phone: "555-burg" }, delivery_address_street: "789 Oak St", delivery_address_city: "Townsville", delivery_instructions: null, total_amount: "18.90", status: "READY_FOR_PICKUP", driver: null, items: [ { menu_item_name_at_purchase: "Classic Burger", quantity: 2 }, { menu_item_name_at_purchase: "Fries", quantity: 1 } ] },
  { id: 204, restaurant_details: { id: 1, name: "Luigi's Pizzeria", address: "123 Pizza St", phone: "555-1234" }, delivery_address_street: "999 Test Rd", delivery_address_city: "Testville", delivery_instructions: "Call upon arrival.", total_amount: "30.00", status: "CONFIRMED", driver: 'agentProfile001', items: [ { menu_item_name_at_purchase: "Pepperoni Special", quantity: 1 } ] },
];
const MOCK_DELIVERY_HISTORY_API_FORMAT_FOR_DRIVER = [ 
  { id: 101, restaurant_details: { name: "Burger Palace" }, user_details: { username: "Old Customer" }, delivered_time: "2024-05-20T10:00:00Z", total_amount: "4.50", status: "DELIVERED"},
  { id: 102, restaurant_details: { name: "Pizza Place" }, user_details: { username: "Another Cust." }, delivered_time: "2024-05-19T14:30:00Z", total_amount: "5.10", status: "DELIVERED" },
  { id: 103, restaurant_details: { name: "Sushi Spot" }, user_details: { username: "Sushi Fan" }, delivered_time: "2024-05-18T18:00:00Z", total_amount: "0.00", status: "CANCELLED_BY_USER"},
];
// --- Fundi i Mock Data ---

const MOCK_API_DELAY_DRIVER = 500; //ms

export const courierApi = {
  // Funksioni loginDriver mund të jetë pjesë e authApi.js globalisht
  // Nëse AuthContext.login e menaxhon si duhet kthimin e rolit DRIVER dhe driver_profile.id
  // Por për momentin e lëmë këtu për qartësi sipas output-it të Gemini-t

  updateDriverAvailability: async (driverProfileId, newStatus, token) => {
    console.log(`COURIER_API: Driver ${driverProfileId} availability to ${newStatus}`);
    // REAL: return apiService.request(`/driver-profiles/${driverProfileId}/`, { method: 'PATCH', body: JSON.stringify({ is_available: newStatus }) });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    if (MOCK_AGENT_DETAILS_FOR_COURIER.id === driverProfileId) { // Sigurohemi që po përditësojmë mock-un e duhur
        MOCK_AGENT_DETAILS_FOR_COURIER.isOnline = newStatus;
    }
    return { success: true, isOnline: newStatus };
  },

  getAvailableTasks: async (token) => {
    console.log("COURIER_API: Fetching available tasks");
    // REAL: return apiService.request('/orders/?status=READY_FOR_PICKUP&driver__isnull=true');
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    // Kthe një kopje për të mos modifikuar direkt array-in mock
    return JSON.parse(JSON.stringify(MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER.filter(t => t.status === 'READY_FOR_PICKUP' && t.driver === null)));
  },

  getCurrentActiveTask: async (driverProfileId, token) => {
    console.log(`COURIER_API: Fetching current active task for driver ${driverProfileId}`);
    // REAL: return apiService.request(`/orders/?driver=${driverProfileId}&status__in=CONFIRMED,PICKED_UP,ON_THE_WAY`);
    // Statuset mund të jenë ndryshe në backend-in tënd (p.sh., PREPARING mund të jetë relevant)
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    const activeStatuses = ["CONFIRMED", "PICKED_UP", "ON_THE_WAY"]; 
    const task = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER.find(
        t => t.driver === driverProfileId && activeStatuses.includes(t.status)
    );
    return task ? [task] : []; // API zakonisht kthen një array
  },

  acceptTask: async (orderId, driverProfileId, token) => { 
    console.log(`COURIER_API: Driver ${driverProfileId} accepting task ${orderId}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { 
    //          method: 'PATCH', 
    //          body: JSON.stringify({ driver: driverProfileId, status: "CONFIRMED" /* Ose statusi tjetër i duhur */ }) 
    //       });
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER.findIndex(t => t.id === orderId && t.status === 'READY_FOR_PICKUP' && t.driver === null);
    if (taskIndex > -1) {
      MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER[taskIndex].status = 'CONFIRMED'; // Statusi i backend-it pas pranimit
      MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER[taskIndex].driver = driverProfileId;
      return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER[taskIndex] }; 
    }
    throw new Error('Task not available or already accepted (mock).');
  },

  updateOrderStatus: async (orderId, newBackendStatus, token) => { 
     console.log(`COURIER_API: Updating order ${orderId} to status ${newBackendStatus}`);
    // REAL: return apiService.request(`/orders/${orderId}/`, { method: 'PATCH', body: JSON.stringify({ status: newBackendStatus }) });
     await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    const taskIndex = MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER.findIndex(t => t.id === orderId);
    if (taskIndex > -1) {
        MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER[taskIndex].status = newBackendStatus;
        // Nëse statusi është terminal (DELIVERED, CANCELLED), hiqe nga "public pool" ose shënoje si të përfunduar
        if (newBackendStatus === 'DELIVERED' || newBackendStatus.startsWith('CANCELLED')) {
            // Mund të shtosh një fushë `completed_at` ose ta zhvendosësh në një array tjetër për historik në mock
            // MOCK_PUBLIC_POOL_TASKS_API_FORMAT.splice(taskIndex, 1); // Opcion
        }
        return { ...MOCK_PUBLIC_POOL_TASKS_API_FORMAT_FOR_DRIVER[taskIndex] };
    }
    throw new Error('Order not found for status update (mock).');
  },

  getAgentDeliveryHistory: async (driverProfileId, token) => { 
    console.log(`COURIER_API: Fetching delivery history for ${driverProfileId}`);
    // REAL: return apiService.request(`/orders/?driver=${driverProfileId}&status__in=DELIVERED,CANCELLED_BY_USER,CANCELLED_BY_RESTAURANT,CANCELLED_BY_DRIVER,FAILED`);
    await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY_DRIVER));
    // Ky mock kthen historikun global, API-ja reale do të filtrojë
    return [...MOCK_DELIVERY_HISTORY_API_FORMAT_FOR_DRIVER]; 
  },
};