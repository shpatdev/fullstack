// src/modules/customer/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import RestaurantListPage from './pages/RestaurantListPage.jsx';
import RestaurantDetailPage from './pages/RestaurantDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
// import CustomerOrderDetailPage from './pages/CustomerOrderDetailPage.jsx'; // For later

const CustomerRoutes = [
  <Route key="home" index element={<RestaurantListPage />} />, // Default for "/" under CustomerLayout
  <Route key="restaurant-list" path="home" element={<RestaurantListPage />} />,
  <Route key="restaurant-detail" path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />,
  <Route key="cart" path="cart" element={<CartPage />} />,
  <Route key="profile" path="profile" element={<ProfilePage />} />,
  <Route key="checkout" path="checkout" element={<CheckoutPage />} />,
  <Route key="order-confirmation" path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />,
  <Route key="my-orders" path="my-orders" element={<MyOrdersPage />} />,
  // <Route key="order-detail" path="my-orders/:orderId" element={<CustomerOrderDetailPage />} />, // For later
];

export default CustomerRoutes;