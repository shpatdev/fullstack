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

  const setAuthToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      apiService.setToken(newToken); // Vendos tokenin për kërkesat e ardhshme të apiService
    } else {
      localStorage.removeItem('authToken');
      apiService.clearToken(); // Pastro tokenin nga apiService
    }
    setTokenState(newToken);
  }, []);

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

    if (userData?.role === 'DRIVER' || userData?.role === 'DELIVERY_PERSONNEL') { // Added DELIVERY_PERSONNEL
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
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      apiService.setToken(currentToken); // Sigurohu që tokeni është vendosur para kërkesës
      const userData = await authApi.fetchMe();
      setUser(userData);
      setIsAuthenticated(true);
      setError(null); // Pastro gabimet e mëparshme në sukses
      return userData; // Kthe userData për përdorim të menjëhershëm (p.sh. në login)
    } catch (err) {
      console.error("AuthContext: Gabim gjatë marrjes së të dhënave të përdoruesit:", err);
      setAuthToken(null); // Token i pavlefshëm, pastroje
      setUser(null);
      setIsAuthenticated(false);
      // Mos e vendos 'err' këtu direkt nëse nuk është specifikisht për fetchAndSetUser
      // Lëre funksionin thirrës (p.sh. login) ta trajtojë gabimin e tij.
      // Por nëse ky dështon gjatë ngarkimit fillestar, mund të jetë e nevojshme.
      // Për momentin, e lëmë kështu, login do të vendosë errorin e vet.
      throw err; // Rijep gabimin që funksioni thirrës ta kapë
    } finally {
      setIsLoading(false);
    }
  }, [setAuthToken]);

  useEffect(() => {
    const initialToken = localStorage.getItem('authToken');
    if (initialToken) {
      fetchAndSetUser(initialToken).catch(() => {
        // Nëse fetchAndSetUser dështon gjatë ngarkimit fillestar (p.sh. token i skaduar)
        // tokeni do të pastrohet nga localStorage brenda fetchAndSetUser
        // Dhe gjendja do të jetë user: null, isAuthenticated: false
        console.log("AuthContext: Tokeni fillestar ishte i pavlefshëm ose ka skaduar.");
      });
    } else {
      setIsLoading(false); // Nuk ka token, ndalo ngarkimin
    }
  }, [fetchAndSetUser]);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials); // credentials = {email, password}
      if (response && response.access) {
        setAuthToken(response.access); // Ruaj tokenin dhe vendose në apiService
        const userData = await fetchAndSetUser(response.access); // Merr të dhënat e userit
        return userData; // Kthe userData për navigim etj.
      } else {
        // Kjo nuk duhet të ndodhë nëse API kthen error për kredenciale të gabuara
        // Por si fallback:
        throw new Error(response?.detail || "Përgjigje e papritur nga serveri gjatë kyçjes.");
      }
    } catch (err) {
      console.error("AuthContext: Gabim gjatë kyçjes:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Email-i ose fjalëkalimi është i pasaktë.";
      setError(errorMessage); // Vendos mesazhin e gabimit
      setAuthToken(null); // Sigurohu që tokeni është pastruar
      setUser(null);
      setIsAuthenticated(false);
      throw new Error(errorMessage); // Rijep gabimin që komponenti Login ta kapë dhe ta shfaqë
    } finally {
      setIsLoading(false);
    }
  };
  
  const adminLogin = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      // Supozojmë se authApi.adminLogin është konfiguruar ose përdorim authApi.login
      const response = await authApi.adminLogin(credentials); // Ose authApi.login
      if (response && response.access) {
        setAuthToken(response.access);
        const userData = await fetchAndSetUser(response.access);
        // Mund të shtosh logjikë specifike për admin këtu nëse nevojitet
        if (userData.role !== 'ADMIN') {
            await logout(); // Bëj logout nëse useri nuk është admin
            throw new Error("Kyçja e administratorit dështoi: Përdoruesi nuk është administrator.");
        }
        return userData;
      } else {
        throw new Error(response?.detail || "Përgjigje e papritur nga serveri gjatë kyçjes së administratorit.");
      }
    } catch (err) {
      console.error("AuthContext: Gabim gjatë kyçjes së administratorit:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Kredencialet e administratorit janë të pasakta.";
      setError(errorMessage);
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const registeredUserData = await authApi.register(userData);
      // Disa API-ë të regjistrimit kthejnë tokena direkt, disa kërkojnë login të veçantë.
      // Supozojmë se API-ja jote nuk kthen tokena direkt pas regjistrimit,
      // por vetëm një mesazh suksesi. Përdoruesi duhet të bëjë login pas regjistrimit.
      if (registeredUserData.access && registeredUserData.refresh) {
        // Nëse API kthen tokena, trajtoji si te login
        localStorage.setItem('accessToken', registeredUserData.access);
        localStorage.setItem('refreshToken', registeredUserData.refresh);
        setToken(registeredUserData.access);
        setRefreshTokenState(registeredUserData.refresh);
        await fetchAndSetUser(registeredUserData.access);
      } else {
        // Nëse API nuk kthen tokena, thjesht trego sukses dhe përdoruesi duhet të bëjë login
        setIsAuthenticated(false); // Nuk është i kyçur automatikisht
      }
      return registeredUserData; // Kthe të dhënat e regjistrimit (p.sh., mesazhin)
    } catch (error) {
      await logout(); // Pastro gjithçka nëse regjistrimi dështon // Bëje await
      console.error("AuthContext: Registration failed", error);
      throw error; // Rihidhe gabimin që Register.jsx ta kapë
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    // Mund të shtosh një thirrje API për të invaliduar tokenin në backend nëse e ke
    // await authApi.logout(); 
    setAuthToken(null); // Pastron tokenin nga localStorage dhe apiService
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Pastro çdo të dhënë tjetër të ruajtur në localStorage nga AuthContext
    localStorage.removeItem('currentRestaurant');
    localStorage.removeItem('agentProfile');
    // Nëse ke mockUserId për shportën e mysafirit dhe dëshiron ta pastrosh në logout (opsionale)
    // localStorage.removeItem('mockUserId'); 

    // Nuk ka nevojë për setIsLoading këtu zakonisht, por varet nga UI
  }, [setAuthToken]);

  const clearAuthError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    token, // Ekspozon tokenin nëse nevojitet diku tjetër (me kujdes)
    login,
    adminLogin, // Shto adminLogin
    register,
    logout,
    fetchAndSetUser, // Mund të jetë e dobishme për rifreskim manual të userit
    setError, // Jep mundësinë për të vendosur gabime nga jashtë (p.sh. ProfilePage)
    clearAuthError, // Jep mundësinë për të pastruar gabimet
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};