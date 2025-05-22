// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi } from '../api/authApi.js'; // Ensure this path is correct

const AuthContext = createContext(null); // This is the actual context object

export const AuthProvider = ({ children }) => { // This is the provider component
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [agent, setAgent] = useState(null);

  const processUserRoleData = useCallback((userData) => {
    setUser(userData);
    if (userData?.role === 'RESTAURANT_OWNER') {
      if (userData.ownsRestaurants && userData.ownsRestaurants.length > 0) {
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
        const driverProfile = userData.driverProfile || { id: userData.id, isOnline: false, name: userData.name || userData.username };
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
      const userData = await authApi.fetchCurrentUser(currentToken);
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
        setToken(storedToken);
        await fetchAndSetUser(storedToken);
      } else {
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
      const data = await authApi.login(credentials);
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      setToken(data.access);
      await fetchAndSetUser(data.access);
      // No explicit return here, state update triggers re-renders
    } catch (error) {
      logout(); // Clear any partial state on login failure
      console.error("AuthContext: Login failed", error);
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  const register = async (userDataForApi) => {
    setLoadingAuth(true);
    try {
      const registeredUserData = await authApi.register(userDataForApi);
      if (registeredUserData.access && registeredUserData.refresh) {
        localStorage.setItem('accessToken', registeredUserData.access);
        localStorage.setItem('refreshToken', registeredUserData.refresh);
        setToken(registeredUserData.access);
        await fetchAndSetUser(registeredUserData.access);
      } else {
        setIsAuthenticated(false);
      }
      return registeredUserData;
    } catch (error) {
      logout(); // Clear any partial state on registration failure
      console.error("AuthContext: Registration failed", error);
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentRestaurant');
    localStorage.removeItem('agentProfile');
    localStorage.removeItem('mockRole');
    localStorage.removeItem('mockUserId');
    localStorage.removeItem('mockUserDetails');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setCurrentRestaurant(null);
    setAgent(null);
  }, []);

  const selectRestaurant = (restaurant) => {
    if (user?.role === 'RESTAURANT_OWNER') {
      setCurrentRestaurant(restaurant);
      localStorage.setItem('currentRestaurant', JSON.stringify(restaurant));
    }
  };

  const updateAgentProfile = useCallback((profileUpdates) => {
    setAgent(prevAgent => {
        const updatedAgent = { ...prevAgent, ...profileUpdates };
        localStorage.setItem('agentProfile', JSON.stringify(updatedAgent));
        return updatedAgent;
    });
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
    <AuthContext.Provider value={{ // This uses the AuthContext object defined above
      user,
      isAuthenticated,
      token,
      loadingAuth,
      currentRestaurant,
      agent,
      login,
      register,
      logout,
      selectRestaurant,
      updateAgentProfile,
      fetchCurrentUser: fetchAndSetUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// This is the custom hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext); // This uses the AuthContext object
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// If you intend for AuthContext itself (the object created by createContext)
// to be imported directly by other files (which is unusual but possible),
// you would need to export it directly:
// export default AuthContext; // for default import
// OR ensure it's a named export if `AuthContext` is imported with curly braces { AuthContext }
// The current setup with `export const AuthProvider` and `export const useAuth` is standard.