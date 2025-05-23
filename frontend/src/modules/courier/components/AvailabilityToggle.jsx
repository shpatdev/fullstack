// src/modules/courier/components/AvailabilityToggle.jsx
import React from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';

const AvailabilityToggle = () => {
  // Emrat e props-ave nga context-i janë përditësuar këtu
  const { isDriverOnline, toggleDriverAvailability, isLoadingAvailabilityToggle } = useTasks();

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
      <h3 className="text-md sm:text-lg font-semibold text-gray-800 dark:text-slate-100 whitespace-nowrap">
        Statusi i Disponueshmërisë:
      </h3>
      <div className="flex items-center space-x-3">
        <span className={`text-sm font-medium ${isDriverOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isLoadingAvailabilityToggle ? ( // Përdor isLoadingAvailabilityToggle
                <span className="flex items-center">
                    <HeroIcon icon="ArrowPathIcon" className="animate-spin h-4 w-4 mr-1.5" /> Përditësohet...
                </span>
            ) : (
                isDriverOnline ? 'Online' : 'Offline'
            )}
        </span>
        <button
            type="button"
            className={`${
            isDriverOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2  
            focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${isDriverOnline ? 'focus:ring-green-500' : 'focus:ring-gray-500'}
            ${isLoadingAvailabilityToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={isDriverOnline}
            onClick={() => !isLoadingAvailabilityToggle && toggleDriverAvailability()}
            disabled={isLoadingAvailabilityToggle}
        >
            <span className="sr-only">Ndrysho disponueshmërinë</span>
            <span
            aria-hidden="true"
            className={`${
                isDriverOnline ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
            />
        </button>
      </div>
    </div>
  );
};
export default AvailabilityToggle;