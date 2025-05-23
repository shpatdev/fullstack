// src/modules/auth/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import { XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'; // Për ikonën e gabimit dhe shfaqjen e fjalëkalimit
import { useNotification } from '../../../context/NotificationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Për toggle të fjalëkalimit
  const { login, isLoading: loadingAuth, error: authError, setError: setAuthError, isAuthenticated, user, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification(); // Correctly destructure showNotification

  // useEffect for clearing authError (e.g., on unmount or when setAuthError changes)
  useEffect(() => {
    // This effect now primarily serves to clear the error when the component unmounts
    // or if setAuthError itself changes (which is unlikely to be a dependency here).
    // The previous logic for clearing on authError change was removed as it might conflict
    // with displaying a new error.
    return () => {
      if (clearAuthError) { // Use clearAuthError from context
        clearAuthError();
      }
    };
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setAuthError) setAuthError(null); // Clear previous auth errors from context

    if (!email || !password) {
      showNotification("Ju lutem plotësoni email-in dhe fjalëkalimin.", "error");
      return;
    }
    
    try {
      const userData = await login({ email, password }); 
      
      if (userData) { 
        showNotification('Kyçja u krye me sukses!', "success");

        const from = location.state?.from?.pathname || null;
        let redirectTo = from;

        // Prevent redirecting to auth pages or if 'from' is not set
        if (!redirectTo || ['/auth/login', '/auth/register', '/auth/admin-login'].includes(from)) {
            if (userData.role === 'ADMIN') {
                redirectTo = '/admin/dashboard';
            } else if (userData.role === 'RESTAURANT_OWNER') {
                redirectTo = '/restaurant/overview';
            } else if (userData.role === 'DRIVER' || userData.role === 'DELIVERY_PERSONNEL') {
                redirectTo = '/driver/dashboard';
            } else if (userData.role === 'CUSTOMER') {
                redirectTo = '/customer/restaurants';
            } else {
                redirectTo = '/customer/restaurants'; // Default fallback
            }
        }
        
        console.log(`LOGIN_PAGE (handleSubmit Navigation): Navigating to: ${redirectTo} from ${location.pathname}`);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      // Error is set by AuthContext's login function and displayed via authError state.
      // showNotification can be used for additional feedback if needed, but authError is primary.
      // showNotification(err.message || "Gabim gjatë kyçjes. Provoni përsëri.", "error");
      console.error("Login page submit error:", err.message);
    }
  };

  return (
    // Mbështjellësi kryesor i këtij komponenti specifik (brenda AuthLayout)
    // AuthLayout tashmë e ofron sfondin dhe qendërzimin e përgjithshëm.
    // Ky div është për stilimin e vetë "kutisë" së login-it.
    <div className="w-full"> {/* Hiq max-w-md dhe space-y-8 nga këtu, AuthLayout e menaxhon */}
      <h2 className="mb-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Kyçu në llogarinë tënde
      </h2>
      {authError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md text-sm">
                <p>{authError}</p> {/* Shfaq gabimin nga AuthContext */}
              </div>
            )}
      <form onSubmit={handleSubmit} className="space-y-5"> {/* Zvogëlo pak hapësirën */}
        <div>
          <label htmlFor="email" className="label-form"> {/* Krijo klasën 'label-form' në CSS global */}
            Adresa Email
          </label>
          {/* mt-1 hiqet pasi label-form ka mb-1 */}
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-form w-full" // Sigurohu që 'input-form' është stiluar mirë
            placeholder="ju@shembull.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label-form">
            Fjalëkalimi
          </label>
          <div className="relative"> {/* Shto relative për pozicionimin e ikonës */}
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-form w-full pr-10" // Shto padding-right për ikonën
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none"
              aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700"
            />
            <label htmlFor="remember-me" className="ml-2 block text-gray-900 dark:text-slate-300">
              Më mbaj mend
            </label>
          </div>
          <div>
            <Link to="/auth/forgot-password" // Sigurohu që kjo rrugë ekziston nëse e përdor
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Keni harruar fjalëkalimin?
            </Link>
          </div>
        </div>

        <div>
          <Button type="submit" fullWidth variant="primary" isLoading={loadingAuth} disabled={loadingAuth} size="lg">
            Kyçu
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Nuk keni llogari?{' '}
          <Link 
              to="/auth/register" // Path i plotë
              state={{ backgroundLocation: location.state?.backgroundLocation || location }} 
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
              Regjistrohu këtu
          </Link>
        </p>
         <p className="mt-2 text-sm">
          <Link to="/auth/admin-login" // Path i plotë
              className="font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
            Kyçu si Administrator
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;