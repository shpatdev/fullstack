// src/modules/courier/components/DeliveryHistorySection.jsx
import React, { useContext } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx'; // Adjust path
import { Loader2 } from 'lucide-react';

const DeliveryHistorySection = () => {
  const { deliveryHistory, totalEarnings, isLoadingHistory, fetchDeliveryHistory } = useTasks();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Delivery History</h3>
        <button
            onClick={fetchDeliveryHistory}
            disabled={isLoadingHistory}
            className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-md"
        >
            {isLoadingHistory ? <Loader2 className="w-3 h-3 animate-spin"/> : "Refresh"}
        </button>
      </div>
      <p className="text-md text-gray-600 mb-3">Total Earnings: <span className="font-semibold text-green-600">€{totalEarnings?.toFixed(2)}</span></p>

      {isLoadingHistory && deliveryHistory.length === 0 ? (
         <div className="text-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Loading history...</p>
        </div>
      ) : deliveryHistory.length === 0 ? (
        <p className="text-gray-500">No delivery history found.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {deliveryHistory.map(task => (
            <div key={task.id} className="p-3 border rounded-md bg-gray-50 text-sm">
              <p className="font-medium text-gray-700">Order {task.orderId} - <span className="capitalize">{task.status}</span></p>
              <p className="text-gray-500">Date: {new Date(task.date).toLocaleString()}</p>
              <p className="text-gray-500">From: {task.restaurantName}</p>
              <p className="text-gray-500">Payout: €{task.payout?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistorySection;