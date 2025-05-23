import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx'; // Sigurohu që ky path është korrekt
import { XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { useNotification } from '../../../context/NotificationContext.jsx';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    role: 'CUSTOMER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, loadingAuth, error: authError, setError: setAuthError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Get the whole notification context object
  const notification = useNotification();

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || (user.role === 'RESTAURANT_OWNER' ? '/restaurant/overview' : user.role === 'DRIVER' ? '/driver/dashboard' : '/customer/restaurants');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

   useEffect(() => {
    return () => {
      if (setAuthError) setAuthError(null);
    };
  }, [setAuthError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) setAuthError(null); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setAuthError) setAuthError(null);

    if (formData.password !== formData.password_confirm) {
      if (notification && typeof notification.showError === 'function') {
        notification.showError("Fjalëkalimet nuk përputhen.");
      } else {
        console.warn('[RegisterPage] showError function is not available from NotificationContext.');
      }
      if (setAuthError) setAuthError("Fjalëkalimet nuk përputhen.");
      return;
    }
    if (formData.password.length < 6) { 
      if (notification && typeof notification.showError === 'function') {
        notification.showError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");
      } else {
        console.warn('[RegisterPage] showError function is not available from NotificationContext.');
      }
      if (setAuthError) setAuthError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");
      return;
    }

    try {
      const payload = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: formData.role,
        phone_number: formData.phone_number || null,
      };
      await register(payload); 
      if (notification && typeof notification.showSuccess === 'function') {
        notification.showSuccess('Regjistrimi u krye me sukses! Ju lutem kyçuni.');
      } else {
        console.warn('[RegisterPage] showSuccess function is not available from NotificationContext.');
      }
      navigate('/auth/login'); 
    } catch (err) {
      let errorMessage = "Gabim gjatë regjistrimit.";
      // Check if err.response exists and has data (from apiService enriched error)
      if (err.response && err.response.detail) {
          errorMessage = err.response.detail;
      } else if (err.response && typeof err.response === 'object') {
          // Fallback for other types of object errors if detail is not present
          const fieldErrors = Object.entries(err.response)
            .map(([key, value]) => {
              let fieldName = key.replace("_", " ");
              fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
              return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
            })
            .join('; ');
          if (fieldErrors) errorMessage = fieldErrors;
          else if (err.message) errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      if (setAuthError) setAuthError(errorMessage);
      if (notification && typeof notification.showError === 'function') {
        notification.showError(errorMessage);
      } else {
        console.warn('[RegisterPage] showError function is not available from NotificationContext. Error to display:', errorMessage);
        // As a fallback, you might want to alert the error or handle it differently
        // For example, if AuthContext's error display is the primary, this might be acceptable.
        // alert(errorMessage); // Or some other fallback UI
      }
      console.error("Register page error:", err);
    }
  };
  
  return (
    <div className="w-full">
      <h2 className="mb-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Krijo një llogari të re
      </h2>
      {authError && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3">
            <div className="flex">
                <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-red-700 dark:text-red-200">{authError}</p>
                </div>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <label htmlFor="first_name_register" className="label-form">Emri</label>
            <input id="first_name_register" name="first_name" type="text" required 
                   value={formData.first_name} onChange={handleChange} 
                   className="input-form w-full mt-1" placeholder="Emri juaj"/>
          </div>
          <div>
            <label htmlFor="last_name_register" className="label-form">Mbiemri</label>
            <input id="last_name_register" name="last_name" type="text" required 
                   value={formData.last_name} onChange={handleChange} 
                   className="input-form w-full mt-1" placeholder="Mbiemri juaj"/>
          </div>
        </div>
        
        <div>
          <label htmlFor="email_register_page" className="label-form">Adresa Email</label>
          <input id="email_register_page" name="email" type="email" autoComplete="email" required 
                 value={formData.email} onChange={handleChange} 
                 className="input-form w-full mt-1" placeholder="ju@shembull.com"/>
        </div>

        <div>
          <label htmlFor="phone_number_register" className="label-form">Numri i Telefonit (Opsional)</label>
          <input id="phone_number_register" name="phone_number" type="tel" 
                 value={formData.phone_number} onChange={handleChange} 
                 className="input-form w-full mt-1" placeholder="+383 4X XXX XXX"/>
        </div>
        
        <div>
          <label htmlFor="password_register_page" className="label-form">Fjalëkalimi</label>
          <div className="relative mt-1">
            <input id="password_register_page" name="password" type={showPassword ? "text" : "password"} required minLength="6" 
                   value={formData.password} onChange={handleChange} 
                   className="input-form w-full pr-10" placeholder="Min. 6 karaktere"/>
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

        <div>
          <label htmlFor="password_confirm_register" className="label-form">Konfirmo Fjalëkalimin</label>
           <div className="relative mt-1">
            <input id="password_confirm_register" name="password_confirm" type={showConfirmPassword ? "text" : "password"} required minLength="6" 
                   value={formData.password_confirm} onChange={handleChange} 
                   className="input-form w-full pr-10" placeholder="Përsërit fjalëkalimin"/>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none"
              aria-label={showConfirmPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
            </button>
          </div>
        </div>

        <div>
            <label htmlFor="role_register_select" className="label-form">Dëshiroj të regjistrohem si:</label>
            <select id="role_register_select" name="role" value={formData.role} onChange={handleChange} className="input-form w-full mt-1">
                <option value="CUSTOMER">Klient</option>
                <option value="RESTAURANT_OWNER">Pronar Restoranti</option>
                <option value="DRIVER">Shofer</option>
            </select>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth variant="primary" isLoading={loadingAuth} disabled={loadingAuth} size="lg">
            Regjistrohu
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
        Keni llogari?{' '}
        <Link 
            to="/auth/login" 
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
            Kyçu këtu
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
