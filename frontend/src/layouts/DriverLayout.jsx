// src/layouts/DriverLayout.jsx
import React, { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx'; // Assuming global
import AvailabilityToggle from '../modules/courier/components/AvailabilityToggle.jsx'; // Path
import { courierApi } from '../api/courierApi.js'; // Path

// Icon for header (could be global)
const DriverAppLogo = () => (<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 10h14M5 14h14M5 18h14"></path></svg>);

const DriverLayout = () => {
  const { agent, logout, updateAgentProfile, isAuthenticated } = useContext(AuthContext); 
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleAvailabilityChange = async (newStatus) => {
    if (!agent || !agent.id) return;
    try {
      // Assuming courierApi uses the token from AuthContext implicitly or it's passed
      await courierApi.updateAgentAvailability(agent.id, newStatus, localStorage.getItem('driverAuthToken') /* Placeholder */); 
      updateAgentProfile({ isOnline: newStatus }); 
      showNotification(`Availability updated to ${newStatus ? 'Online' : 'Offline'}.`, 'success');
    } catch (error) { showNotification('Failed to update availability.', 'error'); }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/driver/login'); // Or appropriate login page
  }

  if (!isAuthenticated || !agent || agent.role !== "DRIVER") { // Role check for safety
    // This should ideally be handled by a ProtectedRoute in AppRoutes.jsx
    // For now, a simple redirect logic within the layout
    useEffect(() => {
        navigate('/driver/login', { replace: true });
    }, [navigate]);
    return null; // Or a loading spinner while redirecting
  }


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <DriverAppLogo />
              <span className="ml-3 text-2xl font-bold text-blue-600">FoodDash Driver</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium hidden sm:block">{agent?.name || agent?.email || 'Driver'}</span>
              <AvailabilityToggle isAvailable={agent?.isOnline || false} onToggle={handleAvailabilityChange} />
              <button onClick={handleLogout} className="py-2 px-3 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg">Logout</button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet /> {/* Renders the specific driver page */}
      </main>
      {/* Optional Footer for Driver Panel */}
    </div>
  );
};
export default DriverLayout;