// src/modules/restaurant/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom'; // Route është OK

// Importo faqet e Restaurant Owner
import OverviewPage from './pages/Overview.jsx';
import ManageOrdersPage from './pages/ManageOrdersPage.jsx';
import MenuManagementPage from './pages/MenuManagementPage.jsx';
import RestaurantSettingsPage from './pages/RestaurantSettingsPage.jsx';
import CustomerReviewsPage from './pages/CustomerReviewsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
// import RestaurantOwnerLayout dhe ProtectedRoute NUK duhen këtu

const RestaurantOwnerRoutes = [
  // Këto rrugë do të jenë relative ndaj path-it prind ("/restaurant")
  <Route key="ro-overview-index" index element={<OverviewPage />} />,
  <Route key="ro-overview-path" path="overview" element={<OverviewPage />} />,
  <Route key="ro-dashboard-alias" path="dashboard" element={<OverviewPage />} />,
  <Route key="ro-orders" path="orders" element={<ManageOrdersPage />} />,
  <Route key="ro-menu" path="menu" element={<MenuManagementPage />} />,
  <Route key="ro-settings" path="settings" element={<RestaurantSettingsPage />} />,
  <Route key="ro-reviews" path="reviews" element={<CustomerReviewsPage />} />,
  <Route key="ro-analytics" path="analytics" element={<AnalyticsPage />} />,
  // <Route key="ro-not-found" path="*" element={<Navigate to="overview" replace />} />,
];

export default RestaurantOwnerRoutes;