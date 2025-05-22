// src/modules/auth/routes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
// import AdminLoginPage from './pages/AdminLoginPage.jsx'; // If you have a separate one
// import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'; // If you implement this

const AuthRoutes = [
  <Route key="login" path="login" element={<LoginPage />} />,
  <Route key="register" path="register" element={<RegisterPage />} />,
  // <Route key="admin-login" path="admin/login" element={<AdminLoginPage />} />, // Example if separate admin login
  // <Route key="forgot-password" path="forgot-password" element={<ForgotPasswordPage />} />,
];

export default AuthRoutes;