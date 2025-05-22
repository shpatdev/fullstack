// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { TaskProvider } from './context/TaskContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider> {/* CartContext might primarily be for customer module */}
            <TaskProvider> {/* TaskContext might primarily be for courier module */}
              <AppRoutes />
            </TaskProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
export default App;