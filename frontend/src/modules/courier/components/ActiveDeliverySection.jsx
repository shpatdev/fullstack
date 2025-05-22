// src/modules/courier/components/ActiveDeliverySection.jsx
import React, { useContext } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx'; // Adjust path
import { Loader2 } from 'lucide-react';

const ActiveDeliverySection = () => {
  const { activeTask, updateActiveTaskStatus, isLoadingActiveTask } = useTasks();

  if (isLoadingActiveTask && !activeTask) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading active task...</p>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Active Delivery</h3>
        <p className="text-gray-500">You do not have an active delivery task.</p>
      </div>
    );
  }

  const handleStatusUpdate = (newStatus) => {
    if (activeTask) {
      updateActiveTaskStatus(newStatus);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Active Delivery</h3>
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-gray-800">Order #{activeTask.orderId}</h4>
        <p className="text-sm text-gray-700">Status: <span className="font-medium capitalize text-blue-600">{activeTask.status.replace(/_/g, ' ')}</span></p>
        <p className="text-sm text-gray-600">Restaurant: {activeTask.restaurantName} ({activeTask.restaurantAddress})</p>
        <p className="text-sm text-gray-600">Customer: {activeTask.customerName} ({activeTask.customerAddress})</p>
        <p className="text-sm text-gray-600">Items: {activeTask.itemsSummary}</p>
        {activeTask.deliveryInstructions && <p className="text-sm text-red-600 mt-1">Instructions: {activeTask.deliveryInstructions}</p>}
        <p className="text-sm text-gray-600 mt-1">Payout: €{activeTask.payout?.toFixed(2)}</p>

        <div className="mt-4 space-x-2">
          {activeTask.status === 'assigned' && (
            <button
              onClick={() => handleStatusUpdate('picked_up')}
              disabled={isLoadingActiveTask}
              className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-md hover:bg-yellow-600"
            >
              Mark as Picked Up
            </button>
          )}
          {activeTask.status === 'picked_up' && (
            <button
              onClick={() => handleStatusUpdate('en_route')}
              disabled={isLoadingActiveTask}
              className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-md hover:bg-indigo-600"
            >
              Mark as En Route
            </button>
          )}
          {activeTask.status === 'en_route' && (
            <button
              onClick={() => handleStatusUpdate('delivered')}
              disabled={isLoadingActiveTask}
              className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600"
            >
              Mark as Delivered
            </button>
          )}
          {/* Add a cancel button if applicable */}
           {isLoadingActiveTask && <Loader2 className="animate-spin h-4 w-4 text-gray-700 inline ml-2" />}
        </div>
      </div>
    </div>
  );
};

export default ActiveDeliverySection;