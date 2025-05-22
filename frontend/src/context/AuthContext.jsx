// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/authApi.js'; // Import your authApi

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('accessToken')); // For apiService
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken); // Set token for apiService to use correctly
        try {
          const userData = await authApi.fetchCurrentUser(); // This now uses the token via apiService
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn("Token validation/user fetch failed on load:", error.message);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoadingAuth(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => { // credentials = { username, password }
    const data = await authApi.login(credentials); // Expects { access, refresh }
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    setToken(data.access); // Update token state for subsequent fetchCurrentUser
    const userData = await authApi.fetchCurrentUser();
    setUser(userData);
    setIsAuthenticated(true);
    return userData; // Return for LoginPage if needed
  };

  const register = async (userData) => { // userData = { username, email, password, role }
    const registeredUser = await authApi.register(userData);
    // If your backend registration returns tokens:
    if (registeredUser.access && registeredUser.refresh) {
        localStorage.setItem('accessToken', registeredUser.access);
        localStorage.setItem('refreshToken', registeredUser.refresh);
        setToken(registeredUser.access);
        const currentUser = await authApi.fetchCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        return currentUser;
    } else {
        // If registration does NOT auto-login, you might want to prompt user to login
        // or automatically call login if you have credentials
        console.log("Registration successful, please login.", registeredUser);
        return registeredUser; // Or trigger login
    }
  };

  const logout = () => {
    // TODO: Call backend API to invalidate refresh token if such an endpoint exists
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setToken(null); // Clear token state
    setIsAuthenticated(false);
    // Consider redirecting to login page via useNavigate() if called from a component within Router context
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, token, login, register, logout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);