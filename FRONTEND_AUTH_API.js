// Auth API Endpoints
// Location: src/api/authAPI.js

import client from './client';

export const authAPI = {
  // User Registration
  register: (data) => {
    return client.post('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role, // 'student', 'faculty', 'parent', 'admin'
    });
  },

  // User Login
  login: (data) => {
    return client.post('/auth/login', {
      email: data.email,
      password: data.password,
      role: data.role, // Required field
    });
  },

  // Logout (frontend-only)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
  },

  // Store credentials
  setCredentials: (token, userId, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);
  },

  // Get stored role
  getRole: () => {
    return localStorage.getItem('role');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
