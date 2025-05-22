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
          {/* CartProvider and TaskProvider might be better placed around specific layouts
              if they are strictly for those roles, but global is fine for now if their
              internal logic handles role-specific data/behavior correctly. */}
          <CartProvider>
            <TaskProvider>
              <AppRoutes />
            </TaskProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
export default App;