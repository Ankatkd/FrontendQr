// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user data (e.g., { phoneNumber, role })
  const [token, setToken] = useState(localStorage.getItem('token') || null); // Stores JWT token
  const [loading, setLoading] = useState(true); // Indicates if authentication check is in progress

  // Function to log in a user
  const login = (userData, authToken) => {
    localStorage.setItem('token', authToken); // Store token in localStorage
    localStorage.setItem('phoneNumber', userData.phoneNumber); // Store phone number for customer view
    setUser(userData);
    setToken(authToken);
    setLoading(false);
  };

  // Function to log out a user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('phoneNumber');
    setUser(null);
    setToken(null);
    setLoading(false);
    // Optionally, navigate to login page here if not handled by router
  };

  // Effect to check authentication status on component mount (page refresh)
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      const storedPhoneNumber = localStorage.getItem('phoneNumber'); // Get phone number for verification

      if (storedToken && storedPhoneNumber) {
        try {
          // Send token and phone number to backend for verification
          const response = await axios.post(`${API_BASE_URL}/api/auth/verify-token`, {
            token: storedToken,
            phoneNumber: storedPhoneNumber // Pass phone number for backend validation
          });

          if (response.data.success) {
            // If token is valid, set user and token in state
            setUser(response.data.user); // Backend should return user data including role
            setToken(storedToken);
          } else {
            // If token is invalid, clear storage and logout
            console.warn('Token verification failed:', response.data.message);
            logout();
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // If API call fails, assume token is invalid or server is down
          logout();
        } finally {
          setLoading(false); // Authentication check complete
        }
      } else {
        setLoading(false); // No token found, not authenticated
      }
    };

    verifyToken();
  }, []); // Run only once on mount

  // Provide the authentication state and functions to children
  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
