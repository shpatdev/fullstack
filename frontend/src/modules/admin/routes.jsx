// src/modules/admin/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
import ManageUsersPage from './pages/ManageUsersPage.jsx';
import ManageRestaurantsPage from './pages/ManageRestaurantsPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx'; // Placeholder
import AdminSettingsPage from './pages/AdminSettingsPage.jsx'; // Placeholder

const AdminRoutes = [
  <Route key="admin-dashboard" index element={<AdminOverviewPage />} />, // Default for /admin
  <Route key="admin-users" path="users" element={<ManageUsersPage />} />,
  <Route key="admin-restaurants" path="restaurants" element={<ManageRestaurantsPage />} />,
  <Route key="admin-orders" path="orders" element={<AdminOrdersPage />} />,
  <Route key="admin-settings" path="settings" element={<AdminSettingsPage />} />,
];

export default AdminRoutes;