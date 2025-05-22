// src/routes/AppRoutes.jsx
import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout.jsx'; // Assuming you'll create this
import AuthLayout from '../layouts/AuthLayout.jsx'; // Assuming you'll create this
import LoginPage from '../modules/auth/pages/Login.jsx';
import RegisterPage from '../modules/auth/pages/Register.jsx';
import RestaurantListPage from '../modules/customer/pages/RestaurantListPage.jsx';
import RestaurantDetailPage from '../modules/customer/pages/RestaurantDetailPage.jsx';
import CartPage from '../modules/customer/pages/CartPage.jsx';
import ProfilePage from '../modules/customer/pages/ProfilePage.jsx';
import { AuthContext } from '../context/AuthContext.jsx'; // Your AuthContext

// Protected Route Component (can be in its own file in utils/ or components/)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loadingAuth } = useContext(AuthContext);
  if (loadingAuth) return <div>Loading authentication...</div>; // Or a spinner
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Layout and Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Customer Layout and Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<RestaurantListPage />} />
        <Route path="/home" element={<RestaurantListPage />} /> {/* Alias for home */}
        <Route path="/restaurants/:restaurantId" element={<RestaurantDetailPage />} />
        <Route path="/cart" element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        {/* Add other customer routes here, e.g., /orders */}
      </Route>

      {/* TODO: Add routes for Admin, Restaurant Owner, Courier later, likely with their own layouts and protected routes */}
      
      {/* Fallback for not found (optional) */}
      {/* <Route path="*" element={<div>404 Page Not Found</div>} /> */}
    </Routes>
  );
};
export default AppRoutes;