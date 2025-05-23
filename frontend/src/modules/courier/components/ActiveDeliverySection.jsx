// src/modules/courier/components/ActiveDeliverySection.jsx
import React from 'react';
import { ArrowPathIcon, TruckIcon, BuildingStorefrontIcon, MapPinIcon, QueueListIcon, ArchiveBoxArrowDownIcon, CheckBadgeIcon, CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/Button';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';

const ActiveDeliverySection = () => {
  const { activeTask, updateActiveTaskStatus, isLoadingActiveTask, isLoadingUpdateStatus } = useTasks();
  
  const notification = useNotification(); 

  if (isLoadingActiveTask && !activeTask) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 text-center">
        <svg className="animate-spin h-8 w-8 text-primary-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a10 10 0 00-9.95 9.5H2a1 1 0 00-1 1v2a1 1 0 001 1h.05A10 10 0 0012 22v-4a8 8 0 01-8-8H4z"></path>
        </svg>
        <p className="text-gray-600 dark:text-slate-300">Duke kontrolluar për detyrë aktive...</p>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">Nuk keni asnjë detyrë aktive.</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Detyrat e pranuara do të shfaqen këtu.</p>
      </div>
    );
  }

  const handleStatusUpdate = (newFrontendStatus) => {
    if (activeTask) {
      updateActiveTaskStatus(newFrontendStatus);
    }
  };

  let nextActions = [];
  if (activeTask.status === 'assigned' || activeTask.status === 'accepted') {
    nextActions.push({ label: 'Kam Arritur te Restoranti', newStatus: 'REACHED_RESTAURANT' });
  } else if (activeTask.status === 'reached restaurant') {
    nextActions.push({ label: 'Kam Marrë Porosinë', newStatus: 'PICKED_UP' });
  } else if (activeTask.status === 'picked up') {
    nextActions.push({ label: 'Kam Arritur te Klienti', newStatus: 'REACHED_CUSTOMER' });
  } else if (activeTask.status === 'reached customer') {
    nextActions.push({ label: 'Porosia u Dorëzua', newStatus: 'DELIVERED' });
    nextActions.push({ label: 'Dorëzimi Dështoi', newStatus: 'FAILED_DELIVERY' });
  }


  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">Detyra Aktive</h2>
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">ID Porosisë:</span>
          <p className="text-gray-800 dark:text-slate-100 font-semibold">#{activeTask.orderId}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Statusi:</span>
          <p className={`text-sm font-semibold capitalize px-2 py-0.5 inline-block rounded-full ${
            activeTask.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200' :
            activeTask.status === 'picked up' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200' :
            activeTask.status === 'failed delivery' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200' :
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200'
          }`}>
            {activeTask.status}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Restoranti:</span>
          <p className="text-gray-800 dark:text-slate-100">{activeTask.restaurantName}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{activeTask.restaurantAddress}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Klienti:</span>
          <p className="text-gray-800 dark:text-slate-100">{activeTask.customerName}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{activeTask.customerAddress}</p>
        </div>
        {activeTask.itemsSummary && (
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Artikujt:</span>
            <p className="text-xs text-gray-600 dark:text-slate-300">{activeTask.itemsSummary}</p>
          </div>
        )}
        {activeTask.deliveryInstructions && (
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Shënime Dërgese:</span>
            <p className="text-xs text-gray-600 dark:text-slate-300 bg-yellow-50 dark:bg-yellow-500/10 p-2 rounded-md">{activeTask.deliveryInstructions}</p>
          </div>
        )}
         <div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Pagesa për Ty:</span>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{activeTask.payout?.toFixed(2) || '0.00'}€</p>
        </div>
      </div>

      {nextActions.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Përditëso Statusin:</p>
          {nextActions.map(action => (
            <button
              key={action.newStatus}
              onClick={() => handleStatusUpdate(action.newStatus)} // Pass backend status directly
              disabled={isLoadingUpdateStatus}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
            >
              {isLoadingUpdateStatus ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a10 10 0 00-9.95 9.5H2a1 1 0 00-1 1v2a1 1 0 001 1h.05A10 10 0 0012 22v-4a8 8 0 01-8-8H4z"></path>
                </svg>
              ) : null}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveDeliverySection;