// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom'; // Renamed Link to avoid conflict

// --- Layouts ---
import AuthLayout from '../layouts/AuthLayout.jsx';
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import RestaurantOwnerLayout from '../layouts/RestaurantOwnerLayout.jsx';
import DriverLayout from '../layouts/DriverLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

// --- Protected Route Component ---
import ProtectedRoute from '../components/ProtectedRoute.jsx'; // Ky path duhet të jetë korrekt

// --- Auth Pages ---
import LoginPage from '../modules/auth/pages/Login.jsx';
import RegisterPage from '../modules/auth/pages/Register.jsx';
// import AdminLoginPage from '../modules/auth/pages/AdminLoginPage.jsx'; // If you have a separate admin login page

// --- Customer Pages ---
import RestaurantListPage from '../modules/customer/pages/RestaurantListPage.jsx';
import RestaurantDetailPage from '../modules/customer/pages/RestaurantDetailPage.jsx';
import CartPage from '../modules/customer/pages/CartPage.jsx';
import ProfilePage from '../modules/customer/pages/ProfilePage.jsx'; // Generic profile page
import CheckoutPage from '../modules/customer/pages/CheckoutPage.jsx';
import OrderConfirmationPage from '../modules/customer/pages/OrderConfirmationPage.jsx';
import MyOrdersPage from '../modules/customer/pages/MyOrdersPage.jsx';

// --- Restaurant Owner Pages ---
import RO_OverviewPage from '../modules/restaurant/pages/Overview.jsx';
import RO_ManageOrdersPage from '../modules/restaurant/pages/ManageOrdersPage.jsx';
import RO_MenuManagementPage from '../modules/restaurant/pages/MenuManagementPage.jsx';
import RO_RestaurantSettingsPage from '../modules/restaurant/pages/RestaurantSettingsPage.jsx';
// import RO_CustomerReviewsPage from '../modules/restaurant/pages/CustomerReviewsPage.jsx';
// import RO_AnalyticsPage from '../modules/restaurant/pages/AnalyticsPage.jsx';

// --- Courier/Driver Pages ---
import DriverDashboardPage from '../modules/courier/pages/DriverDashboardPage.jsx';

// --- Admin Pages ---
import AdminOverviewPage from '../modules/admin/pages/AdminOverviewPage.jsx';
import AdminManageUsersPage from '../modules/admin/pages/ManageUsersPage.jsx';
import AdminManageRestaurantsPage from '../modules/admin/pages/ManageRestaurantsPage.jsx';
// import AdminOrdersPage from '../modules/admin/pages/AdminOrdersPage.jsx';
// import AdminSettingsPage from '../modules/admin/pages/AdminSettingsPage.jsx';


// Fallback Page (404)
const NotFoundPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-100">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <p className="text-2xl text-gray-700 mb-2">Oops! Page Not Found.</p>
        <p className="text-gray-500 mb-6">The page you are looking for might have been removed or is temporarily unavailable.</p>
        <RouterLink to="/" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Go to Homepage
        </RouterLink>
    </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* --- Authentication Routes --- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* If you have a separate AdminLoginPage:
        <Route path="/admin/login" element={<AdminLoginPage />} />
        */}
      </Route>

      {/* --- Customer Routes --- */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<RestaurantListPage />} />
        <Route path="home" element={<RestaurantListPage />} />
        <Route path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />
        <Route path="cart" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}> <CartPage /> </ProtectedRoute>
        }/>
        <Route path="checkout" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}> <CheckoutPage /> </ProtectedRoute>
        }/>
        <Route path="order-confirmation/:orderId" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}> <OrderConfirmationPage /> </ProtectedRoute>
        }/>
        <Route path="my-orders" element={
             <ProtectedRoute allowedRoles={['CUSTOMER']}> <MyOrdersPage /> </ProtectedRoute>
        }/>
        {/* Generic Profile accessible by all authenticated, content adapts based on role */}
        <Route path="profile" element={ 
            <ProtectedRoute> <ProfilePage /> </ProtectedRoute>
        }/>
      </Route>

      {/* --- Restaurant Owner Routes --- */}
      <Route 
        path="/restaurant" 
        element={
          <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}>
            <RestaurantOwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RO_OverviewPage />} />
        <Route path="dashboard" element={<RO_OverviewPage />} />
        <Route path="orders" element={<RO_ManageOrdersPage />} />
        <Route path="menu" element={<RO_MenuManagementPage />} />
        <Route path="settings" element={<RO_RestaurantSettingsPage />} />
        {/* Add other RO routes here */}
      </Route>

      {/* --- Courier/Driver Routes --- */}
      <Route 
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverDashboardPage />} />
        <Route path="dashboard" element={<DriverDashboardPage />} />
        {/* Add other Driver routes here */}
      </Route>

      {/* --- Admin Routes --- */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="dashboard" element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminManageUsersPage />} />
        <Route path="restaurants" element={<AdminManageRestaurantsPage />} />
        {/* <Route path="orders" element={<AdminOrdersPage />} /> */}
        {/* <Route path="settings" element={<AdminSettingsPage />} /> */}
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;