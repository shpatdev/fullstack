// src/modules/courier/components/AvailableTasksSection.jsx
import React, { useEffect, useCallback } from "react";
import Button from "../../../components/Button.jsx";
// import HeroIcon from "../../../components/HeroIcon.jsx"; // FSHIJE KËTË
import { BuildingStorefrontIcon, MapIcon, MapPinIcon, CurrencyDollarIcon as CurrencyEuroIcon, CheckCircleIcon, ArrowPathIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useTasks } from "../../../context/TaskContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

const AvailableTasksSection = () => {
  const { availableTasks, fetchAvailableTasks, acceptTask, isLoadingAccept, errorAccept } = useTasks();
  const { user } = useAuth(); // To ensure courier is available

  const loadTasks = useCallback(() => {
    if (user?.is_available_for_delivery) { // Only fetch if courier is available
      fetchAvailableTasks();
    }
  }, [fetchAvailableTasks, user?.is_available_for_delivery]);

  useEffect(() => {
    loadTasks();
    // Optional: Set up an interval to refresh tasks periodically
    // const intervalId = setInterval(loadTasks, 30000); // Refresh every 30 seconds
    // return () => clearInterval(intervalId);
  }, [loadTasks]);

  if (!user?.is_available_for_delivery) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 text-center">
        <InboxIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">Ju nuk jeni aktiv për dërgesa.</h3>
        <p className="text-gray-500 dark:text-slate-400">Aktivizohuni për të parë detyrat e disponueshme.</p>
      </div>
    );
  }
  
  if (isLoadingAccept && availableTasks.length === 0) { // Show loading only if no tasks are displayed
      return (
        <div className="flex flex-col justify-center items-center min-h-[200px]">
            <ArrowPathIcon className="animate-spin h-10 w-10 text-primary-500 mb-3" />
            <p className="text-gray-500 dark:text-slate-400">Duke kërkuar detyra...</p>
        </div>
    );
  }


  if (availableTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 text-center">
        <InboxIcon className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">Nuk ka detyra të disponueshme për momentin.</h3>
        <p className="text-gray-500 dark:text-slate-400 mb-4">Provoni të rifreskoni listën.</p>
        <Button onClick={loadTasks} isLoading={isLoadingAccept} iconLeft={ArrowPathIcon}>
          Rifresko Detyrat
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-5 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Detyrat e Disponueshme</h2>
        <Button onClick={loadTasks} variant="ghost" size="sm" isLoading={isLoadingAccept && availableTasks.length > 0} disabled={isLoadingAccept} iconLeft={ArrowPathIcon} className="text-sm">
          {isLoadingAccept && availableTasks.length > 0 ? 'Rifreskim...' : 'Rifresko'}
        </Button>
      </div>
      {errorAccept && <p className="text-red-500 text-sm mb-3">{errorAccept}</p>}
      <div className="space-y-4">
        {availableTasks.map((task) => (
          <div key={task.id} className="border dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-2">Porosia #{task.order_id}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
              <div className="flex items-start">
                <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 dark:text-slate-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-slate-300">Nga Restoranti:</span>
                  <p className="text-gray-600 dark:text-slate-400">{task.restaurant_name}</p>
                  <p className="text-gray-500 dark:text-slate-500 text-xs">{task.restaurant_address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-slate-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-slate-300">Për Klientin:</span>
                  <p className="text-gray-600 dark:text-slate-400">{task.customer_name}</p>
                  <p className="text-gray-500 dark:text-slate-500 text-xs">{task.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapIcon className="h-5 w-5 text-gray-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-slate-400">Distanca: {task.distance_km ? `${task.distance_km.toFixed(1)} km` : 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <CurrencyEuroIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-slate-400 font-semibold">Pagesa: {task.delivery_fee ? `${parseFloat(task.delivery_fee).toFixed(2)} €` : 'N/A'}</span>
              </div>
            </div>
            <Button 
              onClick={() => acceptTask(task.id)} 
              isLoading={isLoadingAccept} // Consider a specific loading state per task if needed
              disabled={isLoadingAccept}
              iconLeft={CheckCircleIcon}
              fullWidth
              size="md"
            >
              Prano Detyrën
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableTasksSection;