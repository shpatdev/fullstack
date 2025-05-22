// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
    // Redirect to a generic login page, or a specific one based on `location.pathname` if needed.
    // For example, if trying to access /admin/*, redirect to /admin/login (if it exists) or /login.
    let loginPath = "/login";
    if (location.pathname.startsWith("/admin")) {
        // loginPath = "/admin/login"; // If you have a separate admin login
    } else if (location.pathname.startsWith("/restaurant")) {
        // loginPath = "/restaurant/login"; // If you have a separate restaurant login
    } else if (location.pathname.startsWith("/driver")) {
        // loginPath = "/driver/login"; // If you have a separate driver login
    }
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If allowedRoles is provided, check if the user's role is included
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      console.warn(
        `ProtectedRoute: Access Denied. User role '${user?.role}' is not in allowed roles: [${allowedRoles.join(', ')}]. Current location: ${location.pathname}. Redirecting to home or unauthorized page.`
      );
      // Redirect to a generic unauthorized page or the user's default dashboard based on their role, or home.
      // For simplicity, redirecting to home. You might want a dedicated '/unauthorized' page.
      return <Navigate to="/" state={{ error: "You are not authorized to view this page." }} replace />;
    }
  }

  // If no specific roles are required, just being authenticated is enough.
  return children;
};

export default ProtectedRoute;