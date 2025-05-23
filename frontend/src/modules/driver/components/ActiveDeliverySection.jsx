import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../api/apiService';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext'; // Ensure this path is correct
import Button from '../../../components/Button';
// ... other imports

const ActiveDeliverySection = () => {
  // ... other state variables
  const { user } = useAuth();
  // const { showError, showSuccess } = useNotification(); // LIKELY PROBLEMATIC LINE (around line 24)
  const notification = useNotification(); // CORRECTED: Get the whole notification object

  // ... rest of your component logic

  const handleError = (message) => {
    if (notification && typeof notification.showError === 'function') {
      notification.showError(message);
    } else {
      console.warn('[ActiveDeliverySection] showError function is not available from NotificationContext. Error:', message);
      // Fallback, e.g., alert(message);
    }
  };

  const handleSuccess = (message) => {
    if (notification && typeof notification.showSuccess === 'function') {
      notification.showSuccess(message);
    } else {
      console.warn('[ActiveDeliverySection] showSuccess function is not available from NotificationContext. Success:', message);
    }
  };
  
  // Example of how you might use it in a function:
  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      // ... your API call
      // await apiService.request(...);
      handleSuccess(`Delivery status updated to ${status}.`);
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      handleError(error.message || 'Failed to update delivery status.');
    }
  };

  // ... existing code ...
  // Make sure any direct calls to showError or showSuccess are replaced
  // For example, if you had:
  // showError("Some error");
  // It should become:
  // if (notification && typeof notification.showError === 'function') {
  //   notification.showError("Some error");
  // } else {
  //   console.warn('[ActiveDeliverySection] showError function is not available.');
  // }
  // ... existing code ...

  return (
    <div>
      {/* Your JSX for displaying active deliveries */}
      <p>Active Deliveries Section</p>
      {/* Example button that might trigger a notification */}
      {/* <Button onClick={() => updateDeliveryStatus(1, 'COMPLETED')}>Test Update Status</Button> */}
    </div>
  );
};

export default ActiveDeliverySection;
