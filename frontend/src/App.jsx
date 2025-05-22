// src/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes'; // AppRoutes NUK duhet të ketë Router brenda
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <AppRoutes /> {/* AppRoutes thjesht kthen Routes */}
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
export default App;