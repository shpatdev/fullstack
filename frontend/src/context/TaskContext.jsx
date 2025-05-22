// src/context/TaskContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { courierApi } from '../api/courierApi.js'; // Korrigjo path-in
import { useAuth } from './AuthContext.jsx';   // Përdor useAuth
import { useNotification } from './NotificationContext.jsx'; // Supozojmë global

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { token, agent } = useAuth(); 
  const { showNotification } = useNotification();
  
  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null); 
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  const [isLoadingTasks, setIsLoadingTasks] = useState(false); 
  const [isLoadingActiveTask, setIsLoadingActiveTask] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const mapBackendStatusToFrontend = useCallback((backendStatus) => {
    if (!backendStatus) return 'unknown';
    const statusMap = {
        "READY_FOR_PICKUP": "awaiting_acceptance",
        "CONFIRMED": "assigned", 
        "PICKED_UP": "picked_up",
        "ON_THE_WAY": "en_route",
        "DELIVERED": "delivered",
        "CANCELLED_BY_USER": "cancelled",
        "CANCELLED_BY_RESTAURANT": "cancelled",
        "CANCELLED_BY_DRIVER": "cancelled",
        "FAILED": "cancelled",
    };
    return statusMap[backendStatus.toUpperCase()] || backendStatus.toLowerCase();
  }, []);

  const transformApiOrderToFrontendTask = useCallback((apiOrder) => {
    if (!apiOrder) return null;
    return {
        id: apiOrder.id.toString(), 
        orderId: `#ORD-${apiOrder.id}`,
        payout: parseFloat(apiOrder.total_amount || 0), 
        restaurantName: apiOrder.restaurant_details?.name || 'N/A',
        restaurantAddress: apiOrder.restaurant_details?.address || 'N/A',
        // Për customerName, backend-i yt duhet ta dërgojë te OrderSerializer -> user_details
        customerName: apiOrder.user_details?.username || "Customer", 
        customerAddress: `${apiOrder.delivery_address_street || ''}, ${apiOrder.delivery_address_city || ''}`,
        itemsSummary: apiOrder.items?.map(item => `${item.quantity}x ${item.menu_item_name_at_purchase}`).join(', ') || "N/A",
        status: mapBackendStatusToFrontend(apiOrder.status), 
        deliveryInstructions: apiOrder.delivery_instructions,
        agentId: apiOrder.driver, 
    };
  }, [mapBackendStatusToFrontend]);

  const fetchAvailableTasks = useCallback(async () => {
    if (!token || !agent?.isOnline) { 
      setAvailableTasks([]); return;
    }
    setIsLoadingTasks(true);
    try {
      const tasksFromApi = await courierApi.getAvailableTasks(token); 
      const transformedTasks = tasksFromApi.map(transformApiOrderToFrontendTask);
      setAvailableTasks(transformedTasks.filter(t => t && (!activeTask || t.id !== activeTask.id))); 
    } catch (error) {
      showNotification('Failed to fetch available tasks: ' + error.message, 'error');
      setAvailableTasks([]);
    } finally { setIsLoadingTasks(false); }
  }, [token, agent?.isOnline, activeTask, showNotification, transformApiOrderToFrontendTask]);

  const fetchActiveTaskOnLoad = useCallback(async () => {
    if (!token || !agent?.id) { // agent.id këtu duhet të jetë DriverProfile ID
        setActiveTask(null); 
        setIsLoadingActiveTask(false); // Sigurohu që loading ndalon
        return;
    }
    setIsLoadingActiveTask(true);
    try {
        const activeTasksFromApi = await courierApi.getCurrentActiveTask(agent.id, token); 
        if (activeTasksFromApi && activeTasksFromApi.length > 0) {
            setActiveTask(transformApiOrderToFrontendTask(activeTasksFromApi[0]));
        } else { setActiveTask(null); }
    } catch (error) {
        showNotification('Failed to fetch active task: ' + error.message, 'error');
        setActiveTask(null);
    } finally { setIsLoadingActiveTask(false); }
  }, [token, agent?.id, showNotification, transformApiOrderToFrontendTask]);

  const fetchDeliveryHistory = useCallback(async () => {
    if (!token || !agent?.id) {
      setDeliveryHistory([]); setTotalEarnings(0);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const historyFromApi = await courierApi.getAgentDeliveryHistory(agent.id, token); 
      const transformedHistory = historyFromApi.map(histItem => ({
        id: `HIST-${histItem.id || Date.now()}-${Math.random()}`, // Siguro ID unike për key
        orderId: `#ORD-${histItem.id}`, 
        date: histItem.delivered_time || histItem.created_at || new Date().toISOString(), 
        restaurantName: histItem.restaurant_details?.name || 'N/A',
        customerName: histItem.user_details?.username || "Customer",
        payout: parseFloat(histItem.total_amount || 0), 
        status: mapBackendStatusToFrontend(histItem.status), 
      }));
      setDeliveryHistory(transformedHistory.sort((a,b) => new Date(b.date) - new Date(a.date))); // Rendit sipas datës
      const earnings = transformedHistory.filter(task => task.status === 'delivered').reduce((sum, task) => sum + task.payout, 0);
      setTotalEarnings(earnings);
    } catch (error) {
      showNotification('Failed to fetch delivery history: ' + error.message, 'error');
    } finally { setIsLoadingHistory(false); }
  }, [token, agent?.id, showNotification, mapBackendStatusToFrontend]);
  
  useEffect(() => {
    if (agent?.id && token) {
        fetchActiveTaskOnLoad(); 
        fetchDeliveryHistory();
    } else {
        setActiveTask(null); setAvailableTasks([]); setDeliveryHistory([]); setTotalEarnings(0);
    }
  }, [agent?.id, token, fetchActiveTaskOnLoad, fetchDeliveryHistory]);

  useEffect(() => {
    if (agent?.isOnline && token && !activeTask) { // Shto !activeTask për të mos e thirrur nëse ka detyrë aktive
      fetchAvailableTasks();
    } else if (!agent?.isOnline) {
      setAvailableTasks([]);
    }
  }, [agent?.isOnline, token, fetchAvailableTasks, activeTask]); // Shto activeTask te dependency

  const acceptAgentTask = async (orderIdString) => { 
    if (!token || !agent || !agent.id) { 
        showNotification("Agent details not available.", "error"); return;
    }
    if (activeTask) {
        showNotification("Complete your current task first.", "error"); return;
    }
    const orderIdNumeric = parseInt(orderIdString, 10);
    setIsLoadingTasks(true); 
    try {
      const acceptedOrderFromApi = await courierApi.acceptTask(orderIdNumeric, agent.id, token); 
      setActiveTask(transformApiOrderToFrontendTask(acceptedOrderFromApi)); 
      setAvailableTasks(prev => prev.filter(task => task.id !== orderIdString));
      showNotification(`Task #${orderIdNumeric} accepted!`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to accept task.', 'error');
      fetchAvailableTasks(); 
    } finally { setIsLoadingTasks(false); }
  };

  const updateActiveTaskStatus = async (newFrontendStatus) => { 
    if (!token || !agent || !activeTask?.id) {
      showNotification("No active task or agent details to update status.", "error");
      return;
    }
    
    let backendStatusPayload;
    switch(newFrontendStatus) {
        case 'picked_up': backendStatusPayload = 'PICKED_UP'; break; // Përputhe me modelet Django
        case 'en_route': backendStatusPayload = 'ON_THE_WAY'; break;
        case 'delivered': backendStatusPayload = 'DELIVERED'; break;
        case 'cancelled': backendStatusPayload = 'CANCELLED_BY_DRIVER'; break; // Ose një status më gjenerik nëse backend-i e menaxhon
        default:
            showNotification(`Unknown status update: ${newFrontendStatus}`, 'error');
            return;
    }

    setIsLoadingActiveTask(true);
    try {
      const updatedOrderFromApi = await courierApi.updateOrderStatus(parseInt(activeTask.id), backendStatusPayload, token); 
      const transformedUpdatedTask = transformApiOrderToFrontendTask(updatedOrderFromApi);

      if (newFrontendStatus === 'delivered' || newFrontendStatus === 'cancelled') {
        const historyEntry = { ...transformedUpdatedTask, status: newFrontendStatus, date: new Date().toISOString() }; 
        setDeliveryHistory(prev => [historyEntry, ...prev.filter(h => h.id !== historyEntry.id)].sort((a,b) => new Date(b.date) - new Date(a.date)) );
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
    } finally { setIsLoadingActiveTask(false); }
  };

  const value = { 
    availableTasks, activeTask, deliveryHistory, totalEarnings, 
    fetchAvailableTasks, acceptAgentTask, updateActiveTaskStatus, fetchDeliveryHistory,
    isLoadingTasks, isLoadingActiveTask, isLoadingHistory
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
export const useTasks = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};