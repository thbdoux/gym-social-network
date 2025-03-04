// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified useEffect for authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log("No token found in localStorage");
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Directly attempt to fetch user data with the token
        console.log("Checking authentication with token");
        const response = await api.get('/users/me/');
        console.log("Auth check success, user data received");
        
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error.response?.status);
        
        // Clear token on auth failure
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log("Login attempt from AuthContext");
      const response = await api.post('/users/token/', { username, password });
      
      if (response.data && response.data.access) {
        console.log("Token received in AuthContext");
        localStorage.setItem('token', response.data.access);
        
        // Fetch user data
        try {
          const userResponse = await api.get('/users/me/');
          console.log("User data fetched in AuthContext");
          setUser(userResponse.data);
          setIsAuthenticated(true);
          return true;
        } catch (userError) {
          console.error("Error fetching user data:", userError);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Login error in AuthContext:", error.response?.status);
      return false;
    }
  };

  const logout = useCallback(() => {
    console.log("Logging out from AuthContext");
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Update user profile in context after edits
  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({...prevUser, ...userData}));
  }, []);

  // Force reauthentication check
  const refreshAuth = useCallback(async () => {
    console.log("Forcing auth refresh");
    setIsLoading(true);
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
    
    try {
      const response = await api.get('/users/me/');
      setUser(response.data);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Provide auth state and functions
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    refreshAuth
  };

  // Debug auth state changes
  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, isLoading, hasUser: !!user });
  }, [isAuthenticated, isLoading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};