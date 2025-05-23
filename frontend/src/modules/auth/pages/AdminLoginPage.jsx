// src/modules/auth/pages/AdminLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx';
import { ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useNotification } from '../../../context/NotificationContext.jsx'; // Added for showError

const AdminLoginPage = () => { 
    const { adminLogin, loadingAuth, error: authError, setError: setAuthError, isAuthenticated, user, clearAuthError } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification(); // Changed from showError to showNotification for consistency

    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 

    useEffect(() => {
        // This useEffect can remain if it's only for redirecting an already authenticated admin
        // who lands on this page, but the primary navigation after login happens in handleSubmit.
        if (isAuthenticated && user?.role === 'ADMIN') {
            // navigate('/admin/dashboard', { replace: true }); // This might be too aggressive if page just loaded
        }
        return () => {
            if (clearAuthError) clearAuthError(); // Use clearAuthError from context
        };
    }, [isAuthenticated, user, navigate, clearAuthError]); // Removed setAuthError, added clearAuthError

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(setAuthError) setAuthError(null); 

        if (!email || !password) {
            showNotification("Ju lutem plotësoni email-in dhe fjalëkalimin.", "error"); // Use showNotification
            return;
        }

        try {
            const loggedInUser = await adminLogin({ email, password }); 
            
            if (loggedInUser && loggedInUser.role === 'ADMIN') {
                 showNotification('Kyçja si Admin u krye me sukses!', "success"); // Added success notification
                 navigate('/admin/dashboard', { replace: true });
            } else if (loggedInUser) {
                const message = 'Kyçja u krye, por ju nuk keni privilegje administratori.';
                if(setAuthError) setAuthError(message);
                showNotification(message, "error"); // Use showNotification
            }
        } catch (err) {
            const displayMessage = authError || err.message || 'Gabim gjatë kyçjes së administratorit.';
            showNotification(displayMessage, "error"); 
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