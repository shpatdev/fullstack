// src/routes/AppRoutes.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import LoadingFallback from '../components/LoadingFallback.jsx'; // Keep this import

// Layouts
const AuthLayout = lazy(() => import('../layouts/AuthLayout.jsx'));
const CustomerLayout = lazy(() => import('../layouts/CustomerLayout.jsx'));
const RestaurantOwnerLayout = lazy(() => import('../layouts/RestaurantOwnerLayout.jsx'));
const DriverLayout = lazy(() => import('../layouts/DriverLayout.jsx'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));

// --- Auth Pages ---
const LoginPage = lazy(() => import('../modules/auth/pages/Login.jsx'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage.jsx'));
const AdminLoginPage = lazy(() => import('../modules/auth/pages/AdminLoginPage.jsx'));


// --- Customer Pages ---
const RestaurantListPage = lazy(() => import('../modules/customer/pages/RestaurantListPage.jsx'));
const RestaurantDetailPage = lazy(() => import('../modules/customer/pages/RestaurantDetailPage.jsx'));
const CheckoutPage = lazy(() => import('../modules/customer/pages/CheckoutPage.jsx')); // Keep if directly used, or ensure CustomerRoutesArray covers it
const OrderConfirmationPage = lazy(() => import('../modules/customer/pages/OrderConfirmationPage.jsx')); // Keep if directly used


// --- Driver/Courier Pages ---
const DriverDashboardPage = lazy(() => import('../modules/courier/pages/DriverDashboardPage.jsx'));


// --- Import Arrays of Routes from Modules ---
// Ensure these files exist and export arrays of <Route> elements
import AdminRoutesArray from '../modules/admin/routes.jsx';
import RestaurantOwnerRoutesArray from '../modules/restaurant/routes.jsx';
import CustomerRoutesArray from '../modules/customer/routes.jsx';

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="admin-login" element={<AdminLoginPage />} />
          <Route index element={<Navigate to="login" replace />} />
        </Route>

        {/* Customer Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute roles={['CUSTOMER', 'ADMIN']} redirectPath="/auth/login">
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          {CustomerRoutesArray}
        </Route>

        {/* Restaurant Owner Routes */}
        <Route
          path="/restaurant"
          element={
            <ProtectedRoute roles={['RESTAURANT_OWNER', 'ADMIN']} redirectPath="/auth/login">
              <RestaurantOwnerLayout />
            </ProtectedRoute>
          }
        >
          {RestaurantOwnerRoutesArray}
        </Route>

        {/* Driver/Courier Routes */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute roles={['DRIVER', 'DELIVERY_PERSONNEL', 'ADMIN']} redirectPath="/auth/login">
              <DriverLayout />
            </ProtectedRoute>
          }
        >
          {/* Define specific driver routes here if not in an array */}
          <Route path="dashboard" element={<DriverDashboardPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']} redirectPath="/auth/admin-login">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {AdminRoutesArray}
        </Route>

        {/* Default route */}
        {/* Consider what the true default path should be. If it's for customers, this is fine.
            If it depends on role after login, Login.jsx handles that.
            This redirect primarily handles unauthenticated users hitting the root path.
        */}
        <Route path="/" element={<Navigate to="/customer/restaurants" replace />} /> 
        
        {/* Fallback 404 Page - Consider creating a dedicated 404 component */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100 dark:bg-slate-900">
              <h1 className="text-6xl font-bold text-primary-500">404</h1>
              <p className="text-2xl font-medium text-gray-700 dark:text-slate-300 mt-4">Faqja nuk u gjet</p>
              <p className="text-gray-500 dark:text-slate-400 mt-2">Na vjen keq, faqja që po kërkoni nuk ekziston.</p>
              {/* You can add a Link component here to navigate back to home if needed */}
              {/* <RouterLink to="/" className="mt-6 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">Kthehu te Kryefaqja</RouterLink> */}
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;