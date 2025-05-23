// src/routes/AppRoutes.jsx
import React, { Suspense } from 'react';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom'; // Sigurohu që BrowserRouter është vetëm këtu ose te main.jsx

// --- Layouts ---
import AuthLayout from '../layouts/AuthLayout.jsx';
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import RestaurantOwnerLayout from '../layouts/RestaurantOwnerLayout.jsx';
import DriverLayout from '../layouts/DriverLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

// --- Protected Route Component ---
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// --- Auth Pages ---
import LoginPage from '../modules/auth/pages/Login.jsx';
import RegisterPage from '../modules/auth/pages/RegisterPage.jsx';
import AdminLoginPage from '../modules/auth/pages/AdminLoginPage.jsx';

// --- Customer Pages ---
import RestaurantListPage from '../modules/customer/pages/RestaurantListPage.jsx';
import RestaurantDetailPage from '../modules/customer/pages/RestaurantDetailPage.jsx';
import CartPage from '../modules/customer/pages/CartPage.jsx';
import ProfilePage from '../modules/customer/pages/ProfilePage.jsx';
import CheckoutPage from '../modules/customer/pages/CheckoutPage.jsx';
import OrderConfirmationPage from '../modules/customer/pages/OrderConfirmationPage.jsx';
import MyOrdersPage from '../modules/customer/pages/MyOrdersPage.jsx';

// --- Courier/Driver Pages ---
import DriverDashboardPage from '../modules/courier/pages/DriverDashboardPage.jsx';
// Faqet e Admin dhe Restaurant Owner NUK importohen më direkt këtu,
// ato do të renderizohen nga AdminRoutes dhe RestaurantOwnerRoutes

// --- Import Arrays of Routes from Modules ---
import AdminRoutesArray from '../modules/admin/routes.jsx'; // Emërtoje ndryshe për qartësi
import RestaurantOwnerRoutesArray from '../modules/restaurant/routes.jsx'; // Emërtoje ndryshe
import CustomerRoutesArray from '../modules/customer/routes.jsx'; // Import customer routes array

// Fallback loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500"></div>
    <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Duke ngarkuar...</p>
  </div>
);

// Main Router Component
const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="admin-login" element={<AdminLoginPage />} />
          {/* Add other auth routes like forgot-password if needed */}
          {/* <Route path="forgot-password" element={<ForgotPasswordPage />} /> */}
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
          {/* Render customer routes from the array */}
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
          {/* Render restaurant owner routes from the array */}
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
          <Route path="dashboard" element={<DriverDashboardPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
          {/* Add other driver-specific routes here if any */}
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
          {/* Render admin routes from the array */}
          {AdminRoutesArray}
        </Route>

        {/* Public/Fallback Routes */}
        {/* Default redirect to customer restaurants page */}
        <Route path="/" element={<Navigate to="/customer/restaurants" replace />} />
        
        {/* Catch-all 404 Not Found Page */}
        <Route 
          path="*" 
          element={
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
              <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">Faqja nuk u gjet!</p>
              <RouterLink 
                to="/" 
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Kthehu te Faqja Kryesore
              </RouterLink>
            </div>
          } 
        />
      </Routes>
    </Suspense>
  );
};

// Export AppRouter directly. BrowserRouter should be in main.jsx or App.jsx.
export default AppRouter;