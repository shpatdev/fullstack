// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi } from '../api/authApi.js'; // Ensure this path is correct

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object, can include role, name, email, ownsRestaurants, driverProfile etc.
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // Crucial for initial load
  const [currentRestaurant, setCurrentRestaurant] = useState(null); // For Restaurant Owner
  const [agent, setAgent] = useState(null); // For Driver (Courier)

  const processUserRoleData = useCallback((userData) => {
    setUser(userData);
    if (userData?.role === 'RESTAURANT_OWNER') {
      // Assuming userData.ownsRestaurants is an array of restaurant objects
      // and we pick the first one by default or based on some logic.
      // This logic might be more complex in a real app (e.g., selection screen).
      if (userData.ownsRestaurants && userData.ownsRestaurants.length > 0) {
        // For mock, if restaurant details are directly on user:
         const mockRestaurant = userData.ownsRestaurants[0];
         setCurrentRestaurant(mockRestaurant);
         localStorage.setItem('currentRestaurant', JSON.stringify(mockRestaurant));
      } else {
        setCurrentRestaurant(null);
        localStorage.removeItem('currentRestaurant');
      }
    } else {
      setCurrentRestaurant(null);
      localStorage.removeItem('currentRestaurant');
    }

    if (userData?.role === 'DRIVER') {
        // Assuming driver specific profile data is part of userData or fetched separately
        // For mock, it might be directly in userData.driverProfile
        const driverProfile = userData.driverProfile || { id: userData.id, isOnline: false, name: userData.name || userData.username }; // Mock structure
        setAgent(driverProfile);
        localStorage.setItem('agentProfile', JSON.stringify(driverProfile));
    } else {
        setAgent(null);
        localStorage.removeItem('agentProfile');
    }
  }, []);

  const fetchAndSetUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setCurrentRestaurant(null);
      setAgent(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentRestaurant');
      localStorage.removeItem('agentProfile');
      return null;
    }
    try {
      const userData = await authApi.fetchCurrentUser(currentToken); // Pass token explicitly if needed by API
      setIsAuthenticated(true);
      processUserRoleData(userData);
      return userData;
    } catch (error) {
      console.warn("AuthContext: Token validation/user fetch failed:", error.message);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setCurrentRestaurant(null);
      setAgent(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentRestaurant');
      localStorage.removeItem('agentProfile');
      return null;
    }
  }, [processUserRoleData]);


  useEffect(() => {
    const attemptAutoLogin = async () => {
      setLoadingAuth(true);
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken); // Set token for apiService to use
        await fetchAndSetUser(storedToken);
      } else {
         // Clear all auth related states if no token
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
        setCurrentRestaurant(null);
        setAgent(null);
      }
      setLoadingAuth(false);
    };
    attemptAutoLogin();
  }, [fetchAndSetUser]);


  const login = async (credentials) => {
    setLoadingAuth(true);
    try {
      const data = await authApi.login(credentials); // Expects { access, refresh }
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      setToken(data.access);
      await fetchAndSetUser(data.access);
      setLoadingAuth(false);
      // The userData is returned by fetchAndSetUser and set to state,
      // so no need to return it from login explicitly unless pages need immediate access
    } catch (error) {
      setLoadingAuth(false);
      logout(); // Clear any partial state
      console.error("AuthContext: Login failed", error);
      throw error; // Re-throw for login page to handle
    }
  };

  const register = async (userDataForApi) => {
    setLoadingAuth(true);
    try {
      // authApi.register might directly log in the user (return tokens) or just create the user.
      // Adjust based on your backend's behavior.
      const registeredUserData = await authApi.register(userDataForApi);

      // If backend auto-logins (returns tokens):
      if (registeredUserData.access && registeredUserData.refresh) {
        localStorage.setItem('accessToken', registeredUserData.access);
        localStorage.setItem('refreshToken', registeredUserData.refresh);
        setToken(registeredUserData.access);
        await fetchAndSetUser(registeredUserData.access);
      } else {
        // If registration does NOT auto-login, user needs to login manually.
        // For now, we won't auto-login here to keep it simple.
        // Frontend can redirect to login page with a success message.
        setIsAuthenticated(false); // Ensure not authenticated yet
      }
      setLoadingAuth(false);
      return registeredUserData; // Return data for RegisterPage if needed (e.g., to show success message)
    } catch (error) {
      setLoadingAuth(false);
      logout(); // Clear any partial state
      console.error("AuthContext: Registration failed", error);
      throw error; // Re-throw for register page to handle
    }
  };

  const logout = useCallback(() => {
    // TODO: Call backend API to invalidate refresh token if such an endpoint exists
    // await authApi.logout(localStorage.getItem('refreshToken')); // Example
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentRestaurant');
    localStorage.removeItem('agentProfile');
    localStorage.removeItem('mockRole'); // Clean up mock specific items too
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setCurrentRestaurant(null);
    setAgent(null);
    // Navigation to login page should be handled by the component calling logout
    // or by ProtectedRoutes automatically due to isAuthenticated becoming false.
  }, []);

  // Function for Restaurant Owner to select/change their current restaurant
  const selectRestaurant = (restaurant) => {
    if (user?.role === 'RESTAURANT_OWNER') {
      setCurrentRestaurant(restaurant);
      localStorage.setItem('currentRestaurant', JSON.stringify(restaurant));
    }
  };

  // Function for Driver to update their profile (e.g., availability)
    const updateAgentProfile = useCallback((profileUpdates) => {
        setAgent(prevAgent => {
            const updatedAgent = { ...prevAgent, ...profileUpdates };
            localStorage.setItem('agentProfile', JSON.stringify(updatedAgent));
            return updatedAgent;
        });
         // Also update the main user object if agent details are nested there
        setUser(prevUser => {
            if (prevUser && prevUser.role === 'DRIVER') {
                return {
                    ...prevUser,
                    driverProfile: { ...(prevUser.driverProfile || {}), ...profileUpdates }
                };
            }
            return prevUser;
        });
    }, []);


  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      token,
      loadingAuth,
      currentRestaurant, // For Restaurant Owner
      agent, // For Driver
      login,
      register,
      logout,
      selectRestaurant, // For Restaurant Owner
      updateAgentProfile, // For Driver
      fetchCurrentUser: fetchAndSetUser // Expose if manual refresh is needed elsewhere
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};