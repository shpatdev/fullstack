// src/context/NotificationContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react'; // Assuming lucide-react is used

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null); 

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() }); // Add id for key
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div 
          key={notification.id} // Use key for proper re-render on new notification
          className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white 
          ${notification.type === 'success' ? 'bg-green-500' : ''}
          ${notification.type === 'error' ? 'bg-red-500' : ''}
          ${notification.type === 'info' ? 'bg-blue-500' : ''} z-50 transition-all duration-300 ease-in-out animate-fadeIn`}
        >
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle2 className="inline mr-2" />}
            {notification.type === 'error' && <XCircle className="inline mr-2" />}
            {notification.type === 'info' && <Info className="inline mr-2" />}
            {notification.message}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);