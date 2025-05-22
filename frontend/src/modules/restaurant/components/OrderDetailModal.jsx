// src/modules/restaurant/components/OrderDetailModal.jsx
import React, { useState, useContext } from 'react';
import { XCircle, Loader2, Edit } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext.jsx'; // Path to NotificationContext

const OrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  // Statuses a restaurant owner can typically set from their panel
  const statusOptions = ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "CANCELLED_BY_RESTAURANT"];
  const { showNotification } = useNotification();

  const handleStatusChangeSubmit = async () => {
    setIsUpdating(true);
    try { 
      await onUpdateStatus(order.id, newStatus); 
      // Notification and closing is handled by ManageOrdersPage after successful onUpdateStatus
    } 
    catch (error) { 
      showNotification(error.message || "Failed to update status in modal.", "error"); 
    } 
    finally { setIsUpdating(false); }
  };
  
  const formattedDate = order.created_at ? new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second:'2-digit' }) : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b"> 
          <h2 className="text-2xl font-semibold text-gray-800">Order Details: <span className="text-blue-600">{order.id}</span></h2> 
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"> <XCircle size={28} /> </button> 
        </div>

        <div className="overflow-y-auto pr-2 space-y-4 mb-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><p className="font-medium text-gray-500">Customer:</p> <p className="text-gray-800">{order.user_details?.username || 'N/A'}</p></div>
            <div><p className="font-medium text-gray-500">Order Date:</p> <p className="text-gray-800">{formattedDate}</p></div>
            <div><p className="font-medium text-gray-500">Total Amount:</p> <p className="text-gray-800 font-semibold">€{parseFloat(order.total_amount || 0).toFixed(2)}</p></div>
            <div><p className="font-medium text-gray-500">Current Status:</p> <p className={`font-semibold ${(order.status?.toUpperCase() || '') === 'PENDING' ? 'text-yellow-600' : (order.status?.toUpperCase() || '') === 'DELIVERED' ? 'text-green-600' : 'text-blue-600'}`}>{order.status?.replace('_', ' ').toUpperCase() || 'N/A'}</p></div>
          </div>

          {(order.delivery_address_street || order.delivery_address_city) && ( 
            <div className="mt-3"> 
              <p className="font-medium text-gray-500 text-sm">Delivery Address:</p> 
              <p className="text-gray-800 text-sm">{order.delivery_address_street}, {order.delivery_address_city}</p> 
              {order.delivery_instructions && <p className="text-xs text-gray-500 mt-0.5">Instructions: {order.delivery_instructions}</p>} 
            </div> 
          )}
          
          <div className="mt-3"> 
            <h3 className="text-md font-semibold text-gray-700 mb-2">Items Ordered:</h3> 
            <ul className="space-y-2 text-sm border p-3 rounded-md bg-gray-50 max-h-48 overflow-y-auto"> 
              {order.items && order.items.length > 0 ? order.items.map(item => ( 
                <li key={item.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0"> 
                  <span>{item.quantity} x {item.menu_item_details?.name || 'Unknown Item'}</span> 
                  <span className="text-gray-600">€{(parseFloat(item.price_at_purchase || 0) * item.quantity).toFixed(2)}</span> 
                </li> 
              )) : <li className="text-gray-500">No items listed for this order.</li>} 
            </ul> 
          </div>
        </div>
        
        <div className="border-t pt-4 mt-auto"> 
          <label htmlFor="statusChange" className="block text-sm font-medium text-gray-700 mb-1">Update Order Status:</label> 
          <select 
            id="statusChange" 
            value={newStatus} 
            onChange={(e) => setNewStatus(e.target.value)} 
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-3"
          > 
            {statusOptions.map(opt => ( <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option> ))} 
          </select> 
          <button 
            onClick={handleStatusChangeSubmit} 
            disabled={isUpdating || newStatus === order.status} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          > 
            {isUpdating ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <Edit className="w-4 h-4 mr-2"/>} 
            {isUpdating ? 'Updating...' : 'Update Status'} 
          </button> 
        </div>
      </div>
    </div>
  );
};
export default OrderDetailModal;