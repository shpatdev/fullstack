// src/modules/courier/components/AvailabilityToggle.jsx
import React from 'react';

const AvailabilityToggle = ({ isAvailable, onToggle, isLoading }) => {
  const handleChange = () => {
    if (!isLoading) { // Prevent toggle if an update is in progress
        onToggle(!isAvailable);
    }
  };
  return (
    <label htmlFor="deliveryAvailabilityToggle" className="inline-flex items-center cursor-pointer">
      <input 
         type="checkbox" 
         id="deliveryAvailabilityToggle" 
         className="sr-only peer" 
         checked={isAvailable} 
         onChange={handleChange}
         disabled={isLoading} 
     />
      <div className={`relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 ${isLoading ? 'opacity-50' : 'peer-focus:ring-blue-400'} rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500`}></div>
      <span className="ms-3 text-sm font-medium text-gray-900 hidden lg:block">{isAvailable ? 'Online' : 'Offline'}</span>
    </label>
  );
};
export default AvailabilityToggle;