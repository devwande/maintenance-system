// // frontend/src/context/AuthContext.js
// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { authService } from '../services/api';

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Check if user is logged in
//     const checkAuthStatus = async () => {
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         setIsLoading(false);
//         return;
//       }
      
//       try {
//         const response = await authService.getCurrentUser();
//         setUser(response.data.user);
//       } catch (error) {
//         console.error('Auth check error:', error);
//         localStorage.removeItem('token');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAuthStatus();
//   }, []);

//   const login = async (regNumber, password) => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const data = await authService.login(regNumber, password);
//       setUser(data.user);
//       return { success: true };
//     } catch (error) {
//       setError(error.response?.data?.error || 'Login failed');
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Login failed' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const register = async (userData) => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const data = await authService.register(userData);
//       setUser(data.user);
//       return { success: true };
//     } catch (error) {
//       setError(error.response?.data?.error || 'Registration failed');
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Registration failed' 
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     authService.logout();
//     setUser(null);
//   };

//   const value = {
//     user,
//     isLoading,
//     error,
//     login,
//     register,
//     logout
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };