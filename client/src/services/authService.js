// client/src/services/authService.js
// OWNER: Member 1
// Client API service for authentication and user account calls.

import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials);

export const register = (userData) => api.post('/auth/register', userData);

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get('/users/me');

export const updateMe = (data) => api.put('/users/me', data);

export const getCommunities = () => api.get('/communities');
