// src/modules/auth/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx'; // Sigurohu që path është korrekt

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth(); // Përdor hook-un custom
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    setError(''); setLoading(true);
    try {
      // Backend-i yt mund të kërkojë `name` ose `username`. Përshtate këtu.
      // Rolin "CUSTOMER" e shton API-ja ose e merr si default backend-i.
      await register({ username, email, password, role: "CUSTOMER" }); 
      // Pas regjistrimit të suksesshëm dhe login-it (nëse bëhet nga AuthContext), ridrejtohu
      navigate('/', { replace: true }); 
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Register page error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2></div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center py-2 bg-red-50 rounded-md">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div><label htmlFor="username-register" className="sr-only">Username</label><input id="username-register" name="username" type="text" autoComplete="username" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div><label htmlFor="email-address-register" className="sr-only">Email address</label><input id="email-address-register" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label htmlFor="password-register" className="sr-only">Password</label><input id="password-register" name="password" type="password" autoComplete="new-password" required minLength="8" className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div><label htmlFor="confirm-password" className="sr-only">Confirm Password</label><input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          </div>
          <div><button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">{loading ? 'Creating account...' : 'Create Account'}</button></div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">Already a member?{' '}<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Login here</Link></p>
      </div>
  );
};

export default RegisterPage;