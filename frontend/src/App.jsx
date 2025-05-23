// src/App.jsx
import React from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import AppRouter from './routes/AppRoutes.jsx';
import './App.css'; // Assuming you have this file for global app styles

function App() {
  return (
    <NotificationProvider> {/* Ensure this is uncommented */}
      <AuthProvider>       {/* Ensure this is uncommented */}
        <CartProvider>     {/* Ensure this is uncommented */}
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;