// src/modules/auth/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import HeroIcon from '../../../components/HeroIcon';
import { useNotification } from '../../../context/NotificationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, setError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    console.log("Login.jsx useEffect: isAuthenticated =", isAuthenticated, "| user =", user, "| from =", from);
    if (isAuthenticated && user) {
      let redirectTo = from;
      // If 'from' is generic (root, customer default) or undefined, determine redirect by role
      if (from === "/" || from === "/customer/restaurants" || !location.state?.from) {
        console.log("Login.jsx: 'from' is generic or not set, determining redirect by role:", user.role);
        if (user.role === 'ADMIN') redirectTo = '/admin/overview';
        else if (user.role === 'RESTAURANT_OWNER') redirectTo = '/restaurant/overview';
        else if (user.role === 'DRIVER' || user.role === 'DELIVERY_PERSONNEL') redirectTo = '/driver/dashboard';
        else if (user.role === 'CUSTOMER') redirectTo = '/customer/restaurants';
        // else redirectTo remains 'from' (which could be '/')
      }
      
      // If redirectTo is still generic root, and user is not customer, set specific default
      if (redirectTo === "/" && user.role !== 'CUSTOMER') {
          if (user.role === 'ADMIN') redirectTo = '/admin/overview';
          else if (user.role === 'RESTAURANT_OWNER') redirectTo = '/restaurant/overview';
          else if (user.role === 'DRIVER' || user.role === 'DELIVERY_PERSONNEL') redirectTo = '/driver/dashboard';
          else redirectTo = '/customer/restaurants'; // Fallback for other roles or customer
      } else if (redirectTo === "/" && user.role === 'CUSTOMER') {
          redirectTo = '/customer/restaurants'; // Ensure customer also goes to their default if redirectTo is just "/"
      }


      console.log(`Login.jsx: Final redirect target: "${redirectTo}"`);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from, location.state]); // Added location.state to deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 

    if (!email || !password) {
      showError("Ju lutem plotësoni email-in dhe fjalëkalimin.");
      return;
    }
    
    try {
      await login({ username: email, password });
      showSuccess("Kyçja u krye me sukses!");
    } catch (err) {
      const displayError = err.message || "Email ose fjalëkalim i gabuar.";
      showError(displayError); 
      console.error("Login Page Error:", err);
    }
  };

  // ... pjesa tjetër e JSX (formularit) mbetet e njëjtë ...
  return (
    <>
      <h2 className="my-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        Kyçu në llogarinë tënde
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adresa Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fjalëkalimi
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Më mbaj mend
            </label>
          </div>

          <div className="text-sm">
            <Link to="/auth/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Keni harruar fjalëkalimin?
            </Link>
          </div>
        </div>
        
        {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <HeroIcon icon="XCircleIcon" className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-red-700 dark:text-red-200">{error}</p>
                    </div>
                </div>
            </div>
        )}

        <div>
          <Button type="submit" fullWidth variant="primary" isLoading={isLoading} disabled={isLoading}>
            Kyçu
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Nuk keni llogari?</span></div>
        </div>
        <div className="mt-6">
          <Button as={Link} to="/auth/register" fullWidth variant="ghost">Regjistrohu këtu</Button>
        </div>
         <div className="mt-4 text-center text-sm">
          <Link to="/auth/admin-login" className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300">Kyçu si Administrator</Link>
        </div>
      </div>
    </>
  );
};

export default Login;