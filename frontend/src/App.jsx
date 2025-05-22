import React, { useState, useCallback, createContext } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx'; // We will use this for actual routing
import { BrowserRouter } from 'react-router-dom'; // Import real BrowserRouter

// AppContext was for Gemini's Canvas routing simulation.
// We'll move navigation control to react-router-dom.
// const AppContext = createContext(null);

function App() {
  // Global state like currentPage, pageParams, and navigateApp will be handled by react-router-dom
  // and its hooks (useNavigate, useParams) directly in components.
  // OutletComponent will also be handled by react-router-dom's <Outlet />.

  return (
    <BrowserRouter> {/* Use real BrowserRouter */}
      <AuthProvider>
        <CartProvider>
          {/* 
            The AppRoutes component will now contain all the <Routes> and <Route> definitions,
            including which layout to use for which set of routes.
          */}
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;