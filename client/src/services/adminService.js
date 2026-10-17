// client/src/services/adminService.js
// OWNER: Member 1
// Client API service for Admin Dashboard operations.

import api from './api';

export const getStats = (params) => api.get('/admin/stats', { params });

export const getMembers = (params) => api.get('/admin/members', { params });

export const updateMember = (id, data) => api.patch(`/admin/members/${id}`, data);

export const getReports = (params) => api.get('/admin/reports', { params });

export const updateReport = (id, data) => api.patch(`/admin/reports/${id}`, data);

export const getCommutes = (params) => api.get('/admin/commutes', { params });
