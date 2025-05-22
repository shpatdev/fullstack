// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Sigurohu që rruga te AuthContext është korrekte

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loadingAuth } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="mt-4 text-lg text-gray-700">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      console.warn(
        `ProtectedRoute: Access Denied. User role '${user?.role}' is not in allowed roles: [${allowedRoles.join(', ')}]. Current location: ${location.pathname}. Redirecting to home.`
      );
      return <Navigate to="/" state={{ error: "You are not authorized to view this page." }} replace />;
    }
  }
  return children;
};

export default ProtectedRoute;