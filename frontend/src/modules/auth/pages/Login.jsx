// src/modules/auth/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Use real react-router-dom
import { AuthContext } from '../../../context/AuthContext.jsx'; // Adjust path as needed

const LoginPage = () => {
  const [email, setEmail] = useState(''); // Backend might expect 'username' or 'email'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Use email for username field as per your backend's TokenObtainPairSerializer typically
      await login({ username: email, password }); 
      navigate('/'); // Navigate to home on successful login
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error('Login page error:', err);
    }
    setLoading(false);
  };

  return (
    // ... JSX from Gemini's LoginPage component ...
    // Ensure all onNavigate calls are replaced with <Link to="..."> or navigate()
    // Example: <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register here</Link>
    <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2></div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center py-2 bg-red-50 rounded-md">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div><label htmlFor="email-address" className="sr-only">Email or Username</label><input id="email-address" name="email" type="text" autoComplete="username" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email or Username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label htmlFor="password" className="sr-only">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between"><div className="flex items-center"><input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label></div><div className="text-sm"><Link to="/forgot-password" /* TODO: Implement forgot password */ className="font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</Link></div></div>
          <div><button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button></div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">Not a member?{' '}<Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register here</Link></p>
      </div>
  );
};
export default LoginPage;