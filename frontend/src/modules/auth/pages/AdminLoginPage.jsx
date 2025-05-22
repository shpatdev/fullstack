// src/modules/auth/pages/AdminLoginPage.jsx
import React, { useState } from 'react'; // useContext removed
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import
// You might need a specific admin login function if it's different
// import { adminApi } from '../../../api/adminApi.js'; // If login is specialized for admin

const AdminLoginPage = () => { 
    const { login } = useAuth(); // Changed usage
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@example.com'); 
    const [password, setPassword] = useState('password'); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Using the global login from AuthContext. 
            // Backend must return 'ADMIN' role for this user.
            await login({ username: email, password }); 
            navigate('/admin/dashboard'); // Or /admin/users if that's the default
        } catch (err) {
            setError(err.message || 'Admin login failed.');
        } finally {
            setLoading(false);
        }
    };

    // ... JSX for AdminLoginPage from Gemini's Admin App.jsx output ...
    // Make sure to replace any mockLocalStorage with AuthContext usage
    // and onLoginSuccess with navigate()
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <div className="flex justify-center">
                        {/* Replace with your actual logo component or SVG */}
                        <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 10h14M5 14h14M5 18h14"></path>
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Admin Dashboard Login
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Form inputs for email and password, error display, submit button from Gemini's code */}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address-admin" className="sr-only">Email address</label>
                            <input id="email-address-admin" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="password-admin" className="sr-only">Password</label>
                            <input id="password-admin" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    {error && (<div className="text-red-500 text-sm text-center py-2">{error}</div>)}
                    <div>
                        <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed">
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AdminLoginPage;