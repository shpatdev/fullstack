// src/layouts/RestaurantOwnerLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom'; 
import Sidebar from '../modules/restaurant/components/Sidebar.jsx'; // Assuming Sidebar is moved
import { useAuth } from '../context/AuthContext.jsx'; // Changed import
import { useNotification } from '../context/NotificationContext.jsx'; // Assuming global

const RestaurantOwnerLayout = () => {
  const [activeSection, setActiveSection] = useState('overview'); // Managed by router now
  const { currentRestaurant, user, logout } = useAuth(); // Changed usage
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // From AuthContext
      showNotification('Logged out successfully.', 'info');
      navigate('/login'); // Or appropriate login page for owners
    } catch (error) {
      showNotification('Logout failed.', 'error');
    }
  };
  
  // activeSection will be determined by the matched route, not local state here.
  // Sidebar might need to know the current path to highlight active link.

  if (!user || (user.role !== "RESTAURANT_OWNER" && user.role !== "ADMIN")) { // Role check
    return <Navigate to="/login" replace />;
  }
  if (!currentRestaurant) {
    return <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-700">No restaurant selected or assigned.</p>
        <p className="text-sm text-gray-500 mt-2">Please contact support or select a restaurant if you own multiple.</p>
        {/* Potentially add a restaurant selection component here if user.ownsRestaurants > 0 */}
         <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
        </div>;
  }


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        // Pass necessary props to Sidebar, e.g., to highlight active route
        // activeSection={activeSection} // This will be derived from router location
        // setActiveSection={setActiveSection} // Navigation handled by <Link> in Sidebar
      />
      <main className="flex-1 overflow-y-auto">
        {/* Top bar inside main content could go here if needed */}
        <Outlet context={{ restaurantId: currentRestaurant.id }} /> {/* Pass restaurantId via Outlet context */}
      </main>
    </div>
  );
};

export default RestaurantOwnerLayout;