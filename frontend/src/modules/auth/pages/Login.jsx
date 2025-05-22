// src/modules/auth/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx'; // Correct path

const LoginPage = () => {
  const [email, setEmail] = useState(''); // Backend might expect 'username' or 'email'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after login
  // Default to '/' or a role-specific dashboard
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The login function in AuthContext will fetch user details and set the role.
      // The `from` path will be used for redirection.
      // If a role-specific default is needed, AuthContext's login or ProtectedRoute could handle it.
      await login({ username: email, password });

      // Navigate to the intended page or a default based on role (handled by ProtectedRoute/AppRoutes or AuthContext)
      // For simplicity, we navigate to 'from'. If 'from' was '/login', it might default to '/'
      // Or, you could inspect the user from AuthContext here (after await login completes)
      // and navigate to a role-specific dashboard.
      // e.g. if (user.role === 'ADMIN') navigate('/admin/dashboard'); else navigate(from, { replace: true });
      navigate(from === "/login" ? "/" : from, { replace: true });

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.');
      console.error('Login page error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2></div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center py-2 bg-red-50 rounded-md">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
                <label htmlFor="email-address" className="sr-only">Email or Username</label>
                <input id="email-address" name="email" type="text" autoComplete="username" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email or Username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
            </div>
            {/* <div className="text-sm"><Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</Link></div> */}
          </div>
          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Not a member?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register here
          </Link>
        </p>
      </div>
  );
};
export default LoginPage;