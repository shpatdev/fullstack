// src/context/TaskContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { courierApi } from '../api/courierApi.js'; // Path to your API file
import { AuthContext } from './AuthContext.jsx';   // To get agent info and token
import { useNotification } from './NotificationContext.jsx'; // Assuming global

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { token, agent } = useContext(AuthContext); 
  const { showNotification } = useNotification(); // Assuming this is globally available
  
  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingActiveTask, setIsLoadingActiveTask] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const transformApiOrderToFrontendTask = useCallback((apiOrder) => {
    if (!apiOrder) return null;
    return {
        id: apiOrder.id.toString(), 
        orderId: `#ORD-${apiOrder.id}`, // For display
        payout: parseFloat(apiOrder.total_amount), // Assuming total_amount is payout for driver
        restaurantName: apiOrder.restaurant_details?.name || 'N/A',
        restaurantAddress: apiOrder.restaurant_details?.address || 'N/A',
        customerName: "Customer Name", // Placeholder - your OrderSerializer should provide this
        customerAddress: `${apiOrder.delivery_address_street || ''}, ${apiOrder.delivery_address_city || ''}`,
        itemsSummary: apiOrder.items?.map(item => `${item.quantity}x ${item.menu_item_name_at_purchase}`).join(', ') || 'N/A',
        status: mapBackendStatusToFrontend(apiOrder.status),
        deliveryInstructions: apiOrder.delivery_instructions,
        agentId: apiOrder.driver, // DriverProfile ID
    };
  }, []);

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) return 'unknown';
    const upperStatus = backendStatus.toUpperCase();
    if (upperStatus === "CONFIRMED" && agent && agent.id) return "assigned"; // If confirmed AND has a driver ID
    if (upperStatus === "PICKED_UP") return "picked_up";
    if (upperStatus === "ON_THE_WAY") return "en_route";
    if (upperStatus === "READY_FOR_PICKUP") return "awaiting_acceptance";
    if (upperStatus === "DELIVERED") return "delivered";
    if (upperStatus.includes("CANCELLED")) return "cancelled";
    return backendStatus.toLowerCase();
  };

  const fetchAvailableTasks = useCallback(async () => {
    if (!token || !agent?.isOnline) { 
      setAvailableTasks([]);
      return;
    }
    setIsLoadingTasks(true);
    try {
      const tasksFromApi = await courierApi.getAvailableDeliveryTasks(token);
      const transformed = tasksFromApi.map(transformApiOrderToFrontendTask);
      setAvailableTasks(transformed.filter(t => !activeTask || t.id !== activeTask.id)); 
    } catch (error) {
      showNotification('Failed to fetch available tasks: ' + error.message, 'error');
      setAvailableTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [token, agent?.isOnline, activeTask, showNotification, transformApiOrderToFrontendTask]);

  const fetchActiveTaskOnLoad = useCallback(async () => {
    if (!token || !agent?.id) {
        setActiveTask(null); // Clear active task if no token or agent
        setIsLoadingActiveTask(false);
        return;
    }
    setIsLoadingActiveTask(true);
    try {
        const activeTasksFromApi = await courierApi.getCurrentActiveTask(agent.id, token);
        if (activeTasksFromApi && activeTasksFromApi.length > 0) {
            setActiveTask(transformApiOrderToFrontendTask(activeTasksFromApi[0]));
        } else {
            setActiveTask(null);
        }
    } catch (error) {
        showNotification('Failed to fetch active task: ' + error.message, 'error');
        setActiveTask(null);
    } finally {
        setIsLoadingActiveTask(false);
    }
  }, [token, agent?.id, showNotification, transformApiOrderToFrontendTask]);

  const fetchDeliveryHistory = useCallback(async () => {
    if (!token || !agent?.id) {
      setDeliveryHistory([]); setTotalEarnings(0);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const historyFromApi = await courierApi.getAgentDeliveryHistory(agent.id, token);
      const transformed = historyFromApi.map(histItem => ({
        id: `HIST-${histItem.id}`,
        orderId: `#ORD-${histItem.id}`,
        date: histItem.delivered_time || histItem.created_at, // Use created_at as fallback
        restaurantName: histItem.restaurant_details?.name || 'N/A',
        customerName: histItem.user_details?.username || "Customer",
        payout: parseFloat(histItem.total_amount || 0), // Fallback to 0
        status: mapBackendStatusToFrontend(histItem.status),
      }));
      setDeliveryHistory(transformed);
      const earnings = transformed.filter(task => task.status === 'delivered').reduce((sum, task) => sum + task.payout, 0);
      setTotalEarnings(earnings);
    } catch (error) {
      showNotification('Failed to fetch delivery history: ' + error.message, 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token, agent?.id, showNotification]);
  
  useEffect(() => {
    if (agent?.id && token) {
        fetchActiveTaskOnLoad();
        fetchDeliveryHistory(); // Fetch history on login too
    }
    if (agent?.isOnline && token) {
      fetchAvailableTasks();
    } else {
      setAvailableTasks([]); // Clear available tasks if offline
    }
  }, [agent?.isOnline, agent?.id, token, fetchAvailableTasks, fetchDeliveryHistory, fetchActiveTaskOnLoad]);

  const acceptAgentTask = async (orderIdString) => { 
    if (!token || !agent?.id) { showNotification("Agent not authenticated.", "error"); return; }
    if (activeTask) { showNotification("Complete current task first.", "error"); return; }
    
    const orderIdNumeric = parseInt(orderIdString, 10);
    setIsLoadingTasks(true); // Can also set a specific loading for accept action
    try {
      const acceptedOrderFromApi = await courierApi.acceptTask(orderIdNumeric, agent.id, token);
      setActiveTask(transformApiOrderToFrontendTask(acceptedOrderFromApi));
      setAvailableTasks(prev => prev.filter(task => task.id !== orderIdString));
      showNotification(`Task #${orderIdNumeric} accepted!`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to accept task.', 'error');
      fetchAvailableTasks(); 
    } finally {
        setIsLoadingTasks(false);
    }
  };

  const updateActiveTaskStatus = async (newFrontendStatus) => { 
    if (!token || !agent?.id || !activeTask?.id) return;
    
    let backendStatusPayload = newFrontendStatus.toUpperCase();
    if (newFrontendStatus === 'cancelled') backendStatusPayload = 'CANCELLED_BY_DRIVER';
    if (newFrontendStatus === 'delivered') backendStatusPayload = 'DELIVERED';
    // For 'picked_up' and 'en_route', the frontend status can map to backend 'PICKED_UP', 'ON_THE_WAY'

    setIsLoadingActiveTask(true);
    try {
      const updatedOrderFromApi = await courierApi.updateOrderStatus(parseInt(activeTask.id), backendStatusPayload, token); 
      const transformedUpdatedTask = transformApiOrderToFrontendTask(updatedOrderFromApi);

      if (newFrontendStatus === 'delivered' || newFrontendStatus === 'cancelled') {
        const historyEntry = { ...transformedUpdatedTask, date: new Date().toISOString(), status: newFrontendStatus }; 
        setDeliveryHistory(prev => [historyEntry, ...prev.filter(h => h.id !== historyEntry.id)].sort((a,b) => new Date(b.date) - new Date(a.date)) ); // Add and sort
        if (newFrontendStatus === 'delivered') {
            setTotalEarnings(prev => prev + (transformedUpdatedTask.payout || 0));
        }
        setActiveTask(null);
        fetchAvailableTasks(); 
      } else {
        setActiveTask(transformedUpdatedTask);
      }
      showNotification(`Task status updated to ${newFrontendStatus.replace(/_/g, ' ')}.`, 'success');
    } catch (error) {
      showNotification('Failed to update task status: '+ error.message, 'error');
    } finally {
        setIsLoadingActiveTask(false);
    }
  };

  const contextValue = { 
    availableTasks, activeTask, deliveryHistory, totalEarnings, 
    fetchAvailableTasks, acceptAgentTask, updateActiveTaskStatus, fetchDeliveryHistory,
    isLoadingTasks, isLoadingActiveTask, isLoadingHistory
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};
export const useTasks = () => useContext(TaskContext); // Custom hook