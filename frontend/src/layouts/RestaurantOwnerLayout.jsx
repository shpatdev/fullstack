// src/layouts/RestaurantOwnerLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuth } from '../context/AuthContext';
import Sidebar from '../modules/restaurant/components/Sidebar';
import Button from '../components/Button';
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const RestaurantOwnerLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // For logout
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Determine current restaurant from user context
  const ownedRestaurants = user?.ownsRestaurants || [];
  // For this project, let's assume the first restaurant is the active one.
  // A real app might have a selector if a user owns multiple restaurants.
  const currentRestaurant = ownedRestaurants.length > 0 ? ownedRestaurants[0] : null;

  useEffect(() => {
    // If user becomes authenticated and is a restaurant owner but has no restaurant assigned (edge case)
    // or if currentRestaurant becomes null after being set.
    if (isAuthenticated && user?.role === 'RESTAURANT_OWNER' && !currentRestaurant && !isLoading) {
      // This case should ideally be handled during login/registration (admin assigns restaurant)
      // Or redirect to a page explaining the issue / contact support.
      console.warn("RestaurantOwnerLayout: No restaurant associated with this owner. Redirecting...");
      // navigate('/some-error-page-for-owner'); // Or to a setup page
    }
  }, [currentRestaurant, isAuthenticated, user?.role, isLoading, navigate]);


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
            <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Duke ngarkuar...</p>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'RESTAURANT_OWNER') {
    // Redirect non-owners
    console.warn(`RestaurantOwnerLayout: User with role "${user?.role}" attempted to access. Redirecting.`);
    return <Navigate to="/" replace />;
  }
  
  if (!currentRestaurant) {
    // If still no current restaurant after loading and checks (e.g., not assigned by admin yet)
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4"/>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Restoranti Nuk u Gjet</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Duket se nuk keni një restorant të caktuar në llogarinë tuaj. <br/>
                Ju lutem kontaktoni administratorin e platformës.
            </p>
            <Button onClick={logout} variant="primary" className="mt-6">
                Dilni
            </Button>
        </div>
    );
  }


  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        restaurantName={currentRestaurant.name} 
        restaurantId={currentRestaurant.id}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm print:hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 mr-3"
                  aria-label="Hap menunë anësore"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                <div className="text-lg font-semibold text-gray-800 dark:text-white hidden md:block truncate" title={currentRestaurant.name}>
                  Paneli: {currentRestaurant.name}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                 {/* Placeholder for notifications or quick actions */}
                <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Njoftimet e Restorantit">
                    <BellIcon className="h-6 w-6" />
                    {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span> Example notification dot */}
                </button>
                <Button 
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  iconLeft={ArrowRightOnRectangleIcon}
                  iconLeftClassName="h-5 w-5"
                >
                  <span className="hidden sm:inline">Dilni</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
          {/* Pass currentRestaurantId to all child routes via Outlet context */}
          <Outlet context={{ currentRestaurantId: currentRestaurant.id, currentRestaurantName: currentRestaurant.name }} />
        </main>
      </div>
    </div>
  );
};

export default RestaurantOwnerLayout;