// // frontend/src/services/api.js
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add request interceptor to add auth token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Auth services
// export const authService = {
//   register: async (userData) => {
//     const response = await api.post('/auth/register', userData);
//     if (response.data.token) {
//       localStorage.setItem('token', response.data.token);
//     }
//     return response.data;
//   },
  
//   login: async (regNumber, password) => {
//     const response = await api.post('/auth/login', { regNumber, password });
//     if (response.data.token) {
//       localStorage.setItem('token', response.data.token);
//     }
//     return response.data;
//   },
  
//   logout: () => {
//     localStorage.removeItem('token');
//   },
  
//   getCurrentUser: async () => {
//     return api.get('/auth/me');
//   }
// };

// export default api;