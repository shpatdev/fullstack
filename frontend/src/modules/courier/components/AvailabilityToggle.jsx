// src/modules/courier/components/AvailabilityToggle.jsx
import React from 'react';
import Button from '../../../components/Button';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'; // For loading or status indication if needed
import { useTasks } from '../../../context/TaskContext.jsx';

const AvailabilityToggle = () => {
  const { isDriverOnline, toggleDriverAvailability, isLoadingAvailabilityToggle } = useTasks();

  return (
    <div className={`p-4 rounded-lg shadow-md flex items-center justify-between ${isDriverOnline ? 'bg-green-50 dark:bg-green-800/30' : 'bg-red-50 dark:bg-red-800/30'}`}>
      <div>
        <p className={`text-sm font-medium ${isDriverOnline ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
          Statusi i Disponueshmërisë:
        </p>
        <p className={`text-lg font-semibold ${isDriverOnline ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
          {isDriverOnline ? 'I Disponueshëm për Dërgesa' : 'Jo i Disponueshëm'}
        </p>
      </div>
      <Button 
        onClick={toggleDriverAvailability} 
        isLoading={isLoadingAvailabilityToggle}
        variant={isDriverOnline ? 'danger' : 'success'}
        className="w-40 text-xs sm:text-sm"
        iconLeft={isLoadingAvailabilityToggle ? ArrowPathIcon : (isDriverOnline ? XCircleIcon : CheckCircleIcon)}
        iconLeftClassName="h-5 w-5" // Assuming h-5 w-5 was intended, default is h-4 w-4
        disabled={isLoadingAvailabilityToggle}
      >
        {isLoadingAvailabilityToggle ? 'Ndryshon...' : (isDriverOnline ? 'Bëhu Jo Aktiv' : 'Bëhu Aktiv')}
      </Button>
    </div>
  );
};

export default AvailabilityToggle;