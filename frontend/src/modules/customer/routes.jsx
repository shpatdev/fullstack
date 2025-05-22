// src/modules/customer/routes.jsx
import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom'; // Për module të veçanta
import { Route } from 'react-router-dom'; // Për array

// Faqet e Customer
import RestaurantListPage from './pages/RestaurantListPage.jsx';
import RestaurantDetailPage from './pages/RestaurantDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx'; // ProfilePage mund të jetë i përbashkët

// CustomerLayout dhe ProtectedRoute aplikohen nga AppRoutes.jsx

const CustomerRoutesArray = [
    // Rruga default për /customer/ do të jetë lista e restoranteve
    <Route key="customer-index" index element={<RestaurantListPage />} />,
    <Route key="customer-restaurants" path="restaurants" element={<RestaurantListPage />} />,
    <Route key="customer-restaurant-detail" path="restaurants/:restaurantId" element={<RestaurantDetailPage />} />,
    <Route key="customer-cart" path="cart" element={<CartPage />} />, // ProtectedRoute aplikohet te AppRoutes
    <Route key="customer-checkout" path="checkout" element={<CheckoutPage />} />, // ProtectedRoute aplikohet
    <Route key="customer-order-confirmation" path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />, // ProtectedRoute aplikohet
    <Route key="customer-my-orders" path="my-orders" element={<MyOrdersPage />} />, // ProtectedRoute aplikohet
    <Route key="customer-profile" path="profile" element={<ProfilePage />} /> // ProtectedRoute aplikohet
];

export default CustomerRoutesArray;