// src/modules/restaurant/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import OverviewPage from './pages/Overview.jsx';
import ManageOrdersPage from './pages/ManageOrdersPage.jsx';
import MenuManagementPage from './pages/MenuManagementPage.jsx';
import RestaurantSettingsPage from './pages/RestaurantSettingsPage.jsx';
// Import other pages like Reviews, Analytics when created
// import CustomerReviewsPage from './pages/CustomerReviewsPage.jsx';
// import AnalyticsPage from './pages/AnalyticsPage.jsx';


const RestaurantOwnerRoutes = [
  <Route key="ro-dashboard" index element={<OverviewPage />} />, // Default for /restaurant
  <Route key="ro-overview" path="dashboard" element={<OverviewPage />} />,
  <Route key="ro-orders" path="orders" element={<ManageOrdersPage />} />,
  <Route key="ro-menu" path="menu" element={<MenuManagementPage />} />,
  <Route key="ro-settings" path="settings" element={<RestaurantSettingsPage />} />,
  // <Route key="ro-reviews" path="reviews" element={<CustomerReviewsPage />} />,
  // <Route key="ro-analytics" path="analytics" element={<AnalyticsPage />} />,
];

export default RestaurantOwnerRoutes;