// src/modules/auth/pages/AdminLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx';
import { ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useNotification } from '../../../context/NotificationContext.jsx'; // Added for showError

const AdminLoginPage = () => { 
    const { adminLogin, loadingAuth, error: authError, setError: setAuthError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const { showError } = useNotification(); // Get showError from context

    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 

    useEffect(() => {
        // Redirect if already authenticated as admin
        if (isAuthenticated && user?.role === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
        }
        // Cleanup auth error on component unmount
        return () => {
            if (setAuthError) setAuthError(null);
        };
    }, [isAuthenticated, user, navigate, setAuthError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(setAuthError) setAuthError(null); 

        if (!email || !password) {
            showError("Ju lutem plotësoni email-in dhe fjalëkalimin.");
            return;
        }

        try {
            const loggedInUser = await adminLogin({ email, password }); 
            
            if (loggedInUser && loggedInUser.role === 'ADMIN') {
                 // AuthContext's fetchAndSetUser and subsequent isAuthenticated update 
                 // should trigger the useEffect for navigation.
                 // Explicit navigation can be a fallback or primary method.
                 navigate('/admin/dashboard', { replace: true });
            } else if (loggedInUser) {
                // Logged in but not an admin
                const message = 'Kyçja u krye, por ju nuk keni privilegje administratori.';
                if(setAuthError) setAuthError(message);
                showError(message);
                // Consider logging out the user if they are not an admin
                // await logout(); 
            }
            // If adminLogin fails, it should throw an error caught below,
            // and AuthContext should set its own error state.
        } catch (err) {
            // Error should be set by adminLogin in AuthContext.
            // Display it via showError if not already handled by a global authError display.
            const displayMessage = authError || err.message || 'Gabim gjatë kyçjes së administratorit.';
            showError(displayMessage); 
            // Ensure authError in context is also set if not already
            if (setAuthError && !authError) {
                 setAuthError(displayMessage);
            }
            console.error("Admin Login page error:", err);
        }
    };

    return (
        <div className="w-full"> {/* AuthLayout will provide the main card styling */}
            <div className="flex justify-center mb-4">
                <ShieldCheckIcon className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="mb-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Paneli i Administratorit
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                {authError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3">
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
                <div>
                    <label htmlFor="email-address-admin" className="label-form">Email</label>
                    <input id="email-address-admin" name="email" type="email" autoComplete="email" required 
                           className="input-form w-full" placeholder="admin@shembull.com" 
                           value={email} onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }} />
                </div>
                <div>
                    <label htmlFor="password-admin" className="label-form">Fjalëkalimi</label>
                    <input id="password-admin" name="password" type="password" autoComplete="current-password" required 
                           className="input-form w-full" placeholder="••••••••" 
                           value={password} onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }} />
                </div>
                <div>
                    <Button type="submit" fullWidth variant="primary" isLoading={loadingAuth} disabled={loadingAuth} size="lg">
                        {loadingAuth ? 'Duke u kyçur...' : 'Kyçu si Admin'}
                    </Button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm">
                <Link to="/auth/login" className="font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Nuk jeni admin? Kyçu si përdorues.
                </Link>
            </p>
        </div>
    );
};
export default AdminLoginPage;