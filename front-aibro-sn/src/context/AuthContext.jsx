import React, { createContext, useState, useEffect } from 'react';
import { userService } from '../api/services';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on mount or token change
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await userService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      // Use the login method from userService
      const tokenData = await userService.login(username, password);
      localStorage.setItem('token', tokenData.access);
      
      // Get user data after successful login
      const userData = await userService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout,
        setUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};