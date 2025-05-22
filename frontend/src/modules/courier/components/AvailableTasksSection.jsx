// src/modules/courier/components/AvailableTasksSection.jsx
import React, { useContext } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx'; // Adjust path as per your TaskContext location
import { Loader2 } from 'lucide-react'; // Or your preferred loader icon

const AvailableTasksSection = () => {
  const { availableTasks, acceptAgentTask, isLoadingTasks } = useTasks();

  if (isLoadingTasks && availableTasks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading available tasks...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Available Delivery Tasks</h3>
      {availableTasks.length === 0 && !isLoadingTasks ? (
        <p className="text-gray-500">No tasks available currently. Check back soon!</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {availableTasks.map(task => (
            <div key={task.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-800">Order #{task.orderId}</h4>
              <p className="text-sm text-gray-600">From: {task.restaurantName} ({task.restaurantAddress})</p>
              <p className="text-sm text-gray-600">To: {task.customerAddress}</p>
              <p className="text-sm text-gray-600">Payout: €{task.payout?.toFixed(2)}</p>
              <button
                onClick={() => acceptAgentTask(task.id)}
                className="mt-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
              >
                Accept Task
              </button>
            </div>
          ))}
          {isLoadingTasks && <p className="text-center text-gray-500 mt-2">Checking for more tasks...</p>}
        </div>
      )}
    </div>
  );
};

export default AvailableTasksSection;