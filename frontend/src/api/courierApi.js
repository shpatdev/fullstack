// src/api/courierApi.js
import { apiService } from './apiService.js'; // Sigurohu që ky path është korrekt

export const courierApi = {
  // Veprimet e shoferit mbi profilin e tij (p.sh. disponueshmëria)
  // Këto zakonisht do të shkonin te një DriverProfileViewSet ose UserMeAPIView i zgjeruar
  updateDriverAvailability: async (is_available) => {
    // Supozojmë një endpoint te UserMeAPIView ose një @action specifik te një DriverProfileViewSet
    // ku backend-i e di se cili shofer po bën kërkesën nga token-i.
    console.log(`COURIER_API (Real): Setting availability to ${is_available}`);
    return apiService.request(`/auth/me/set-availability/`, { // SHEMBULL ENDPOINT - KRIJOJE!
        method: 'PATCH', 
        body: JSON.stringify({ is_available }) 
    });
  },

  // Veprimet mbi porositë/dërgesat
  getAvailableTasks: async () => {
    console.log("COURIER_API (Real): Fetching available tasks for logged-in driver");
    // Backend-i duhet të kthejë porositë që janë READY_FOR_PICKUP dhe që nuk kanë shofer,
    // ose që përputhen me kriteret e shoferit (p.sh., lokacioni).
    return apiService.request('/orders/available-for-driver/'); // SHEMBULL ENDPOINT - KRIJOJE!
  },

  getMyCurrentActiveTask: async () => { 
    console.log(`COURIER_API (Real): Fetching current active task for logged-in driver`);
    // Backend-i kthen porosinë aktive (CONFIRMED, PICKED_UP, ON_THE_WAY) për shoferin e kyçur.
    // Mund të jetë një order i vetëm ose një array bosh.
    return apiService.request('/orders/my-active-delivery/'); // SHEMBULL ENDPOINT - KRIJOJE!
  },

  acceptDeliveryTask: async (orderId) => { 
    console.log(`COURIER_API (Real): Logged-in driver accepting task ${orderId}`);
    // Backend-i cakton request.user (shoferin) te kjo porosi dhe ndryshon statusin.
    return apiService.request(`/orders/${orderId}/accept-delivery/`, { // @action te OrderViewSet - KRIJOJE!
      method: 'PATCH', 
      // Body mund të jetë bosh, backend-i e merr shoferin nga request.user
    });
  },

  updateDeliveryStatus: async (orderId, newStatus) => { 
    console.log(`COURIER_API (Real): Updating order ${orderId} to status ${newStatus} by driver`);
    // Përdor @action specifik te OrderViewSet për shoferin
    return apiService.request(`/orders/${orderId}/update-status-driver/`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status: newStatus }) 
    });
  },

  getDriverDeliveryHistory: async () => { 
    console.log(`COURIER_API (Real): Fetching delivery history for logged-in driver`);
    // OrderViewSet.get_queryset() tashmë duhet të filtrojë bazuar në shoferin e kyçur
    // dhe të kthejë vetëm porositë me statuse finale.
    return apiService.request('/orders/?status__in=DELIVERED,FAILED_DELIVERY,CANCELLED_BY_RESTAURANT,CANCELLED_BY_USER'); 
    // Ose një endpoint specifik /orders/my-delivery-history/
  },
};