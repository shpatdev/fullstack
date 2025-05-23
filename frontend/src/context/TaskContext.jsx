// src/context/TaskContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { courierApi } from '../api/courierApi.js'; // Sigurohu që path-i është korrekt
import { useAuth } from './AuthContext.jsx';      // Sigurohu që path-i është korrekt
import { useNotification } from './NotificationContext.jsx'; // Sigurohu që path-i është korrekt

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { user, isAuthenticated, token, fetchAndSetUser } = useAuth();
  const { showSuccess, showError } = useNotification(); // Hiq showInfo nëse nuk e përdor

  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null); // Ky do të mbajë formatin që pret ActiveDeliverySection
  const [deliveryHistory, setDeliveryHistory] = useState([]); // Ky do të mbajë formatin që pret DeliveryHistorySection
  
  // Supozojmë se user objekti nga AuthContext ka një fushë 'is_driver_available' ose të ngjashme
  // Përshtate këtë me modelin tënd real të User/DriverProfile në Django.
  const [isDriverOnline, setIsDriverOnline] = useState(user?.is_driver_available || false); 

  const [isLoading, setIsLoading] = useState({
    availableTasks: false, // Për listën e detyrave të disponueshme
    activeTask: false,     // Për detyrën aktive
    deliveryHistory: false,// Për historikun
    availabilityToggle: false, // Për ndryshimin e statusit online/offline
    acceptTask: false,         // Kur pranohet një detyrë
    updateTaskStatus: false,   // Kur përditësohet statusi i detyrës aktive
    taskIdBeingAccepted: null, // Për të treguar loading te butoni specifik i pranimit
  });
  // const [error, setError] = useState(null); // Gabimet trajtohen me showError

  const transformTaskDataForFrontend = (taskDataFromApi) => {
    if (!taskDataFromApi || !taskDataFromApi.id) return null;
    // Ky funksion transformon përgjigjen e API-së në formatin që presin komponentët
    // ActiveDeliverySection dhe AvailableTasksSection.TaskCard
    // Përshtate fushat bazuar në atë që kthen API-ja jote reale.
    return {
        id: taskDataFromApi.id, // ID e porosisë, përdoret si key dhe për veprime
        orderId: taskDataFromApi.id, // Përputhje me ActiveDeliverySection
        status: taskDataFromApi.status?.toLowerCase().replace(/_/g, ' ') || 'unknown', // P.sh., 'assigned', 'picked up'
        
        restaurantName: taskDataFromApi.restaurant?.name || 'Restorant i Panjohur',
        restaurantAddress: taskDataFromApi.restaurant?.address_details?.street 
                           ? `${taskDataFromApi.restaurant.address_details.street}, ${taskDataFromApi.restaurant.address_details.city}`
                           : (taskDataFromApi.restaurant?.address || 'Adresë e Panjohur'),
        
        customerName: taskDataFromApi.customer?.full_name || taskDataFromApi.customer?.email || 'Klient i Panjohur',
        customerAddress: `${taskDataFromApi.delivery_address_street || 'Rrugë e Panjohur'}, ${taskDataFromApi.delivery_address_city || 'Qytet i Panjohur'}`,
        
        itemsSummary: taskDataFromApi.items?.map(item => `${item.quantity}x ${item.item_name_at_purchase}`).join(', ') || 'Pa artikuj',
        deliveryInstructions: taskDataFromApi.delivery_address_notes || null,
        
        // Për AvailableTasksSection.TaskCard (nga API-ja e /orders/available-for-driver/)
        restaurant_details: { 
            name: taskDataFromApi.restaurant?.name || 'N/A',
            address: taskDataFromApi.restaurant?.address_details?.street 
                     ? `${taskDataFromApi.restaurant.address_details.street}, ${taskDataFromApi.restaurant.address_details.city}`
                     : (taskDataFromApi.restaurant?.address || 'N/A'),
        },
        delivery_address_street: taskDataFromApi.delivery_address_street || '',
        delivery_address_city: taskDataFromApi.delivery_address_city || '',
        total_amount: parseFloat(taskDataFromApi.order_total || 0).toFixed(2),

        // Për ActiveDeliverySection dhe DeliveryHistorySection (payout)
        payout: parseFloat(taskDataFromApi.driver_payout || (parseFloat(taskDataFromApi.order_total || 0) * 0.08) || 0), // Shembull: 8% payout, ose merr nga API
        
        // Për DeliveryHistorySection (date)
        date: taskDataFromApi.actual_delivery_time || taskDataFromApi.updated_at || taskDataFromApi.created_at,
    };
  };


  const fetchAvailableTasks = useCallback(async () => {
    if (!isAuthenticated || !(user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') || !isDriverOnline || !token) {
        setAvailableTasks([]); return;
    }
    setIsLoading(prev => ({ ...prev, availableTasks: true }));
    try {
      const tasksFromApi = await courierApi.getAvailableTasks(); // Supozon se kthen një array
      setAvailableTasks((tasksFromApi || []).map(transformTaskDataForFrontend).filter(Boolean));
    } catch (err) { 
        showError(err.message || "S'u mund të ngarkoheshin detyrat e disponueshme."); 
        setAvailableTasks([]); 
    } finally { 
        setIsLoading(prev => ({ ...prev, availableTasks: false })); 
    }
  }, [isAuthenticated, user, isDriverOnline, token, showError]);

  const fetchActiveTask = useCallback(async () => {
    if (!isAuthenticated || !(user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') || !token) {
        setActiveTask(null); return;
    }
    setIsLoading(prev => ({ ...prev, activeTask: true }));
    try {
      const taskDataFromApi = await courierApi.getMyCurrentActiveTask(); // API kthen një objekt të vetëm ose null/404
      setActiveTask(transformTaskDataForFrontend(taskDataFromApi));
    } catch (err) { 
        // Zakonisht 404 nëse nuk ka detyrë aktive, nuk është gabim kritik
        if (err.response && err.response.status === 404) {
            setActiveTask(null);
        } else {
            console.warn("TaskContext: Problem në marrjen e detyrës aktive:", err.message);
            setActiveTask(null);
        }
    } finally { 
        setIsLoading(prev => ({ ...prev, activeTask: false })); 
    }
  }, [isAuthenticated, user, token]);

  const fetchDeliveryHistory = useCallback(async () => {
    if (!isAuthenticated || !(user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') || !token) {
        setDeliveryHistory([]); return;
    }
    setIsLoading(prev => ({ ...prev, deliveryHistory: true }));
    try {
      const historyFromApi = await courierApi.getDriverDeliveryHistory();
      setDeliveryHistory((historyFromApi || []).map(transformTaskDataForFrontend).filter(Boolean));
    } catch (err) { 
        showError(err.message || "S'u mund të ngarkohej historiku."); 
        setDeliveryHistory([]); 
    } finally { 
        setIsLoading(prev => ({ ...prev, deliveryHistory: false })); 
    }
  }, [isAuthenticated, user, token, showError]);

  const toggleDriverAvailability = async () => { // Nuk ka nevojë për argument, merr statusin nga state-i lokal
    if (!isAuthenticated || !(user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') || !token) return;
    
    const newAvailabilityApiPayload = !isDriverOnline; // Statusi që do t'i dërgohet API-së
    setIsLoading(prev => ({ ...prev, availabilityToggle: true }));
    try {
      await courierApi.updateDriverAvailability(newAvailabilityApiPayload); // Dërgo statusin e ri
      setIsDriverOnline(newAvailabilityApiPayload); // Përditëso UI menjëherë
      if (fetchAndSetUser && token) await fetchAndSetUser(token); // Rifresko gjendjen e user-it globalisht
      showSuccess(`Disponueshmëria: ${newAvailabilityApiPayload ? 'Online' : 'Offline'}`);
      if (newAvailabilityApiPayload) { 
        fetchAvailableTasks(); 
        fetchActiveTask(); // Kontrollo nëse ka ndonjë detyrë aktive të papërfunduar
      } else { 
        setAvailableTasks([]); 
        // Mos e bëj setActiveTask(null) këtu, pasi shoferi mund të dojë të përfundojë detyrën aktive para se të bëhet offline plotësisht
      }
    } catch (err) { 
        showError(err.message || "Gabim tek disponueshmëria.");
        // Ktheje statusin e UI nëse API dështon (opsionale)
        // setIsDriverOnline(isDriverOnline); 
    } finally { 
        setIsLoading(prev => ({ ...prev, availabilityToggle: false })); 
    }
  };

  const acceptTask = async (orderId) => {
    if (!isAuthenticated || !(user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') || activeTask || !token) {
        showError(activeTask ? "Keni një detyrë aktive." : "Problem autentikimi."); return;
    }
    setIsLoading(prev => ({ ...prev, acceptTask: true, taskIdBeingAccepted: orderId }));
    try {
      const acceptedTaskData = await courierApi.acceptDeliveryTask(orderId);
      setActiveTask(transformTaskDataForFrontend(acceptedTaskData));
      setAvailableTasks(prev => prev.filter(task => task.id !== orderId));
      showSuccess(`Detyra #${orderId} u pranua!`);
    } catch (err) { 
        showError(err.message || "Gabim gjatë pranimit. Mund të jetë marrë."); 
        fetchAvailableTasks(); // Rifresko listën e detyrave
    } finally { 
        setIsLoading(prev => ({ ...prev, acceptTask: false, taskIdBeingAccepted: null })); 
    }
  };

  // Emri i funksionit duhet të përputhet me atë të komponentit: updateActiveTaskStatus
  const updateActiveTaskStatus = async (newFrontendStatus) => {
    if (!isAuthenticated || !activeTask || !activeTask.id || !token) { // Kontrollo edhe activeTask.id
        showError("Nuk ka detyrë aktive për t'u përditësuar."); return;
    }
    const newBackendStatus = newFrontendStatus.toUpperCase().replace(/ /g, '_'); // P.sh., "picked up" -> "PICKED_UP"
    
    setIsLoading(prev => ({ ...prev, updateTaskStatus: true }));
    try {
      const updatedOrderFromApi = await courierApi.updateDeliveryStatus(activeTask.id, newBackendStatus);
      showSuccess(`Statusi u ndryshua në "${newFrontendStatus}".`);
      
      const finalStatuses = ['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED_BY_USER', 'CANCELLED_BY_RESTAURANT'];
      if (finalStatuses.includes(newBackendStatus)) {
        setActiveTask(null);
        fetchDeliveryHistory(); // Rifresko historikun
        if(isDriverOnline) fetchAvailableTasks(); // Kontrollo për detyra të reja vetëm nëse është online
      } else {
        setActiveTask(transformTaskDataForFrontend(updatedOrderFromApi));
      }
    } catch (err) { 
        showError(err.message || "Gabim gjatë përditësimit të statusit."); 
        // Mund të duhet të rifreskosh activeTask për të marrë statusin e fundit nga serveri në rast gabimi
        fetchActiveTask();
    } finally { 
        setIsLoading(prev => ({ ...prev, updateTaskStatus: false })); 
    }
  };
  
  const totalEarnings = deliveryHistory.reduce((sum, task) => sum + (task.payout || 0), 0);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'DRIVER' || user?.role === 'DELIVERY_PERSONNEL') && token) {
      if (isDriverOnline) {
        fetchActiveTask();
        fetchAvailableTasks();
      } else {
        setAvailableTasks([]);
        // Mos e bëj activeTask null këtu nëse shoferi bëhet offline, ai mund të dojë ta përfundojë.
        // fetchActiveTask() do ta trajtojë këtë.
      }
      fetchDeliveryHistory();
    } else {
      setAvailableTasks([]); setActiveTask(null); setDeliveryHistory([]); setIsDriverOnline(false);
    }
  }, [isAuthenticated, user, token, isDriverOnline, fetchAvailableTasks, fetchActiveTask, fetchDeliveryHistory]); // Shto isDriverOnline si dependencë

  return (
    <TaskContext.Provider value={{
        availableTasks, 
        activeTask, 
        deliveryHistory, 
        isDriverOnline, 
        totalEarnings, // Shtuar kjo
        // Përdor emra më konsistentë për isLoading props
        isLoadingAvailableTasks: isLoading.availableTasks,
        isLoadingActiveTask: isLoading.activeTask,
        isLoadingHistory: isLoading.deliveryHistory,
        isLoadingAvailabilityToggle: isLoading.availabilityToggle,
        isLoadingAcceptTask: isLoading.acceptTask,
        isLoadingUpdateStatus: isLoading.updateTaskStatus,
        taskIdBeingAccepted: isLoading.taskIdBeingAccepted,
        
        fetchAvailableTasks, 
        fetchActiveTask, 
        fetchDeliveryHistory,
        toggleDriverAvailability, 
        acceptTask, 
        updateActiveTaskStatus, // Emri i saktë
    }}>
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