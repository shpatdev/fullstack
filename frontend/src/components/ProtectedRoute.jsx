// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, roles, redirectPath = '/auth/login' }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Shfaq një tregues ngarkimi ndërsa gjendja e autentikimit verifikohet
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Përdoruesi nuk është i kyçur, ridrejtoje te faqja e kyçjes
    // Ruaj vendndodhjen aktuale që të mund të kthehemi pas kyçjes
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Përdoruesi është i kyçur, kontrollo rolet nëse janë specifikuar
  if (roles && roles.length > 0) {
    const userHasRequiredRole = user && roles.includes(user.role?.toUpperCase()); // Sigurohu që krahasimi i roleve është case-insensitive ose normalizo
    if (!userHasRequiredRole) {
      // Përdoruesi nuk ka rolin e duhur, ridrejtoje te një faqe 'Unauthorized' ose te faqja kryesore
      // Për thjeshtësi, po e ridrejtojmë te faqja kryesore e klientit ose një faqe 'access-denied'
      // Mund të shtosh një prop tjetër për 'unauthorizedRedirectPath'
      console.warn(`ProtectedRoute: User with role '${user?.role}' does not have required roles: ${roles.join(', ')}. Redirecting.`);
      return <Navigate to="/customer/restaurants" state={{ from: location }} replace />; // Ose një faqe specifike 'Unauthorized'
    }
  }

  // Përdoruesi është i kyçur dhe ka rolin e duhur (nëse kërkohet)
  return children;
};

export default ProtectedRoute;