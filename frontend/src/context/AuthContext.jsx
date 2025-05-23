// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authApi } from '../api/authApi.js';
import { apiService } from '../api/apiService.js'; // Për të vendosur/hequr tokenin globalisht

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Fillon true për të kontrolluar tokenin fillestar
  const [error, setError] = useState(null);
  const [token, setTokenState] = useState(localStorage.getItem('authToken')); // Lexo tokenin nga localStorage

  // currentRestaurant and agent state, not directly related to the loop but part of context
  const [currentRestaurant, setCurrentRestaurant] = useState(() => {
    const saved = localStorage.getItem('currentRestaurant');
    return saved ? JSON.parse(saved) : null;
  });
  const [agent, setAgent] = useState(() => {
    const saved = localStorage.getItem('agentProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const setAuthToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      apiService.setToken(newToken);
    } else {
      localStorage.removeItem('authToken');
      apiService.clearToken();
    }
    setTokenState(newToken);
  }, [setTokenState]); // setTokenState is stable

  const processUserRoleData = useCallback((userData) => {
    setUser(userData); // setUser is stable
    if (userData?.role === 'RESTAURANT_OWNER') {
      if (userData.ownsRestaurants && userData.ownsRestaurants.length > 0) {
         const restaurantToSet = userData.ownsRestaurants[0];
         setCurrentRestaurant(restaurantToSet); // setCurrentRestaurant is stable
         localStorage.setItem('currentRestaurant', JSON.stringify(restaurantToSet));
      } else {
        setCurrentRestaurant(null);
        localStorage.removeItem('currentRestaurant');
      }
    } else {
      setCurrentRestaurant(null);
      localStorage.removeItem('currentRestaurant');
    }

    if (userData?.role === 'DRIVER' || userData?.role === 'DELIVERY_PERSONNEL') {
        const driverProfileToSet = userData.driverProfile || { id: userData.id, isOnline: false, name: userData.name || userData.username };
        setAgent(driverProfileToSet); // setAgent is stable
        localStorage.setItem('agentProfile', JSON.stringify(driverProfileToSet));
    } else {
        setAgent(null);
        localStorage.removeItem('agentProfile');
    }
  }, [setCurrentRestaurant, setAgent]); // setUser is part of processUserRoleData's first line.

  const fetchAndSetUser = useCallback(async (currentToken) => {
    console.log("AuthContext: fetchAndSetUser called with token:", currentToken ? "present" : "absent");
    if (!currentToken) {
      processUserRoleData(null); // Clear user data
      setIsAuthenticated(false);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Ensure apiService has the correct token if called independently.
      // Corrected the method name from getToken to getAuthToken
      if (apiService.getAuthToken() !== currentToken) { 
          apiService.setToken(currentToken);
      }

      const userData = await authApi.fetchMe();
      processUserRoleData(userData);
      setIsAuthenticated(true);
      setError(null);
      return userData;
    } catch (err) {
      console.error("AuthContext: Error during fetchAndSetUser:", err);
      setAuthToken(null);
      processUserRoleData(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthToken, processUserRoleData, setIsAuthenticated, setIsLoading, setError]);

  useEffect(() => {
    const initialToken = localStorage.getItem('authToken');
    console.log("AuthContext - initial token check effect. Initial token:", initialToken ? "present" : "absent");
    if (initialToken) {
      // No need to call apiService.setToken() here if fetchAndSetUser does it,
      // or if apiService.request always gets token from localStorage.
      // The primary purpose here is to trigger user fetching if a token exists.
      fetchAndSetUser(initialToken).catch(err => {
        console.error("AuthContext: Error during initial fetchAndSetUser from useEffect:", err);
        // Error handling is inside fetchAndSetUser, including clearing token if invalid
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchAndSetUser]);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);
      if (data && data.access) {
        setAuthToken(data.access);
        const userData = await fetchAndSetUser(data.access);
        return userData; // Return user data
      } else {
        throw new Error(data.detail || "Login failed: No access token received.");
      }
    } catch (err) {
      console.error("AuthContext: Login error", err);
      const errorMessage = err.response?.data?.detail || err.message || "Gabim gjatë kyçjes.";
      setError(errorMessage);
      // Ensure auth state is cleared on login failure
      setAuthToken(null);
      processUserRoleData(null); // Use processUserRoleData to clear user related states
      setIsAuthenticated(false);
      throw new Error(errorMessage); // Re-throw for the component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.adminLogin(credentials);
      if (data && data.access) {
        setAuthToken(data.access);
        const userData = await fetchAndSetUser(data.access);
        return userData; // Return user data
      } else {
        throw new Error(data.detail || "Admin login failed: No access token received.");
      }
    } catch (err) {
      console.error("AuthContext: Admin Login error", err);
      const errorMessage = err.response?.data?.detail || err.message || "Gabim gjatë kyçjes së administratorit.";
      setError(errorMessage);
      setAuthToken(null);
      processUserRoleData(null); // Use processUserRoleData to clear user related states
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Define an internal logout function for use within register's catch
  const internalLogout = useCallback(async () => {
    setAuthToken(null);
    processUserRoleData(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('currentRestaurant');
    localStorage.removeItem('agentProfile');
  }, [setAuthToken, processUserRoleData, setIsAuthenticated, setError]);


  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const registeredUserData = await authApi.register(userData);
      if (registeredUserData.access && registeredUserData.refresh) {
        setAuthToken(registeredUserData.access); // Use setAuthToken
        // setRefreshTokenState(registeredUserData.refresh); // Assuming you have a refreshTokenState
        await fetchAndSetUser(registeredUserData.access);
      } else {
        setIsAuthenticated(false);
      }
      return registeredUserData;
    } catch (error) {
      await internalLogout(); // Call the internal, useCallback-wrapped logout
      console.error("AuthContext: Registration failed", error);
      const errorMessage = error.response?.data?.detail || error.message || "Gabim gjatë regjistrimit.";
      setError(errorMessage); // Set error state
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = useCallback(() => {
    console.log("AuthContext: logoutUser called");
    internalLogout(); // Use the internal logout logic
  }, [internalLogout]);

  const clearAuthError = useCallback(() => {
    setError(null);
  }, [setError]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    login,
    adminLogin,
    register,
    logout: logoutUser, // Expose logoutUser as 'logout'
    fetchAndSetUser, // Expose if needed for manual refresh, though typically handled internally
    setAuthToken, // Expose if external parts need to set token (e.g. OAuth callback)
    setError, // Allow components to set auth-related errors if necessary
    clearAuthError, // Allow components to clear auth errors
    currentRestaurant, // expose currentRestaurant
    agent, // expose agent
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};