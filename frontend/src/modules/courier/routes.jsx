// src/modules/courier/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import DriverDashboardPage from './pages/DriverDashboardPage.jsx';
// Import other driver-specific pages if you create them, e.g., DriverProfilePage

const CourierRoutes = [
  // Assuming DriverLayout handles the /driver or /courier prefix and protection
  <Route key="driver-dashboard" index element={<DriverDashboardPage />} />, // Default for /driver or /courier
  // <Route key="driver-profile" path="profile" element={<DriverProfilePage />} />,
  // <Route key="driver-earnings" path="earnings" element={<DriverEarningsPage />} />,
];

export default CourierRoutes;