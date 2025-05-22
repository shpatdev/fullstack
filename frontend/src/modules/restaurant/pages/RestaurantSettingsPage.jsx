// src/modules/restaurant/pages/RestaurantSettingsPage.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom'; // If using Outlet context

const RestaurantSettingsPage = () => {
  // const { restaurantId } = useOutletContext(); // Example if passing via Outlet
  // Or get currentRestaurant.id from AuthContext
  return <div className="p-6"><h1 className="text-2xl font-semibold">Restaurant Settings</h1><p className="mt-2 text-gray-600">Forms for restaurant details and opening hours will appear here.</p></div>;
};
export default RestaurantSettingsPage;