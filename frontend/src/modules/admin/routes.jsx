// src/modules/admin/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom'; // Route është OK për t'u përdorur kështu kur kthehet si array

// Importo faqet e Adminit
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
import ManageUsersPage from './pages/ManageUsersPage.jsx';
import ManageRestaurantsPage from './pages/ManageRestaurantsPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
// import AdminLayout dhe ProtectedRoute NUK duhen këtu, ato aplikohen te AppRoutes.jsx

const AdminRoutes = [
  // Këto rrugë do të jenë relative ndaj path-it prind ("/admin") të definuar te AppRoutes.jsx
  // Layout-i dhe ProtectedRoute do të aplikohen nga ai prind.
  <Route key="admin-overview-index" index element={<AdminOverviewPage />} />,
  <Route key="admin-overview-path" path="overview" element={<AdminOverviewPage />} />,
  <Route key="admin-dashboard-alias" path="dashboard" element={<AdminOverviewPage />} />,
  <Route key="admin-users" path="users" element={<ManageUsersPage />} />,
  <Route key="admin-restaurants" path="restaurants" element={<ManageRestaurantsPage />} />,
  <Route key="admin-orders" path="orders" element={<AdminOrdersPage />} />,
  <Route key="admin-settings" path="settings" element={<AdminSettingsPage />} />,
  // Fallback brenda /admin/* mund të shtohet këtu nëse dëshiron,
  // por AppRoutes.jsx ka një fallback global.
  // <Route key="admin-not-found" path="*" element={<Navigate to="overview" replace />} />,
];

export default AdminRoutes;