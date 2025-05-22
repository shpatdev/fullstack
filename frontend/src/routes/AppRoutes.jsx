// src/routes/AppRoutes.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom'; // Sigurohu që BrowserRouter është vetëm këtu ose te main.jsx

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
import RegisterPage from '../modules/auth/pages/Register.jsx';
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

// Fallback loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500"></div>
    <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Duke ngarkuar...</p>
  </div>
);

// Fallback Page (404)
const NotFoundPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gray-100 dark:bg-gray-900">
        <h1 className="text-6xl font-bold text-primary-500 dark:text-primary-400 mb-4">404</h1>
        <p className="text-2xl text-gray-700 dark:text-gray-300 mb-2">Oops! Faqja Nuk u Gjet.</p>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Faqja që po kërkoni mund të jetë hequr ose është përkohësisht e padisponueshme.</p>
        <RouterLink to="/" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Kthehu te Faqja Kryesore
        </RouterLink>
    </div>
);

const AppRoutes = () => {
  return (
    // <BrowserRouter> {/* SIGUROHU QË BrowserRouter është vetëm NJË HERË, idealisht te main.jsx */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* --- Authentication Routes --- */}
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/admin-login" element={<AdminLoginPage />} />
          </Route>

          {/* --- Customer Routes --- */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<RestaurantListPage />} />
            <Route path="restaurants" element={<RestaurantListPage />} />
            <Route path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />
            <Route path="cart" element={ <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}> <CartPage /> </ProtectedRoute> }/>
            <Route path="checkout" element={ <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}> <CheckoutPage /> </ProtectedRoute> }/>
            <Route path="order-confirmation/:orderId" element={ <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}> <OrderConfirmationPage /> </ProtectedRoute> }/>
            <Route path="my-orders" element={ <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}> <MyOrdersPage /> </ProtectedRoute> }/>
            <Route path="profile" element={ <ProtectedRoute allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DRIVER', 'ADMIN']}> <ProfilePage /> </ProtectedRoute> }/>
          </Route>

          {/* --- Restaurant Owner Routes --- */}
          <Route 
            path="/restaurant/*" 
            element={ 
              <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'ADMIN']}> 
                <RestaurantOwnerLayout /> 
              </ProtectedRoute> 
            }
          >
            {/* Render each Route from the array */}
            {RestaurantOwnerRoutesArray} 
          </Route>

          {/* --- Courier/Driver Routes --- */}
          <Route 
            path="/driver/*" 
            element={ 
              <ProtectedRoute allowedRoles={['DRIVER', 'DELIVERY_PERSONNEL', 'ADMIN']}> 
                <DriverLayout /> 
              </ProtectedRoute> 
            } 
          >
            <Route index element={<DriverDashboardPage />} />
            <Route path="dashboard" element={<DriverDashboardPage />} />
          </Route>

          {/* --- Admin Routes --- */}
          <Route 
            path="/admin/*" 
            element={ 
              <ProtectedRoute allowedRoles={['ADMIN']}> 
                <AdminLayout /> 
              </ProtectedRoute> 
            }
          >
            {/* Render each Route from the array */}
            {AdminRoutesArray}
          </Route>

          <Route path="/" element={<Navigate to="/customer/restaurants" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    // </BrowserRouter> {/* SIGUROHU QË BrowserRouter është vetëm NJË HERË */}
  );
};
export default AppRoutes;