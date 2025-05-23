// src/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import AppRouter from './routes/AppRoutes.jsx'; // Import the router configuration
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;