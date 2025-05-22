// src/modules/restaurant/pages/ManageOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useContext removed
import { Loader2, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx'; // AuthContext import removed, useAuth is correct
import { useNotification } from '../../../context/NotificationContext.jsx';
import { restaurantApi } from '../../../api/restaurantApi.js';
import OrderTableRow from '../components/OrderTableRow.jsx'; // Path to component
import OrderDetailModal from '../components/OrderDetailModal.jsx'; // Path to component

const ManageOrdersPage = () => {
  const { currentRestaurant, token } = useAuth(); // This is already correct
  const restaurantId = currentRestaurant?.id; // Get restaurantId from context

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId || !token) { 
      setOrders([]); // Clear orders if no restaurant or token
      setIsLoading(false); 
      return; 
    }
    setIsLoading(true); setError(null);
    try {
      const fetchedOrders = await restaurantApi.fetchRestaurantOrders(restaurantId, token);
      setOrders(fetchedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
      showNotification(err.message || 'Failed to fetch orders.', 'error');
      setOrders([]); // Clear orders on error
    } finally { setIsLoading(false); }
  }, [restaurantId, token, showNotification]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewUpdateOrder = (order) => { setSelectedOrder(order); setIsModalOpen(true); };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!token) { showNotification('Authentication token is missing.', 'error'); return; }
    try {
      await restaurantApi.updateOrderStatus(orderId, newStatus, token);
      showNotification(`Order ${orderId} status updated to ${newStatus}!`, 'success');
      fetchOrders(); 
      setIsModalOpen(false); setSelectedOrder(null);
    } catch (err) { showNotification(err.message || 'Failed to update order status.', 'error');}
  };

  if (isLoading) return <div className="p-6 flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
  if (error && orders.length === 0) return <div className="p-6 text-red-600 bg-red-100 rounded-md">Error: {error} <button onClick={fetchOrders} className="ml-2 text-blue-600 underline">Try again</button></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Orders</h1>
        <button onClick={fetchOrders} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex items-center disabled:opacity-50" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>} Refresh Orders
        </button>
      </div>
      {orders.length === 0 && !isLoading && !error ? ( // Added !error here
        <div className="bg-white shadow-lg rounded-xl p-6 text-center text-gray-500">No orders found for this restaurant.</div>
      ) : error && orders.length === 0 ? null : ( // Don't show table if error and no orders
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Order ID</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => ( <OrderTableRow key={order.id} order={order} onViewUpdate={handleViewUpdateOrder} /> ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isModalOpen && selectedOrder && ( <OrderDetailModal order={selectedOrder} onClose={() => setIsModalOpen(false)} onUpdateStatus={handleUpdateStatus} /> )}
    </div>
  );
};
export default ManageOrdersPage;