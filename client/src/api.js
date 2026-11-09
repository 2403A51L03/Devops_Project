import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const register = (userData) => axios.post(`${API_URL}/auth/register`, userData);
export const login = (userData) => axios.post(`${API_URL}/auth/login`, userData);

// Complaints - Student
export const createComplaint = (complaintData) => api.post('/complaints', complaintData);
export const getMyComplaints = () => api.get('/complaints/my');
export const getComplaint = (id) => api.get(`/complaints/${id}`);
export const updateComplaint = (id, data) => api.put(`/complaints/${id}`, data);
export const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

// Admin
export const getAllComplaints = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    return api.get(`/complaints/admin/all?${params.toString()}`);
};

export const updateComplaintStatus = (id, data) => api.put(`/complaints/admin/${id}/status`, data);
export const getDashboardStats = () => api.get('/complaints/admin/stats/dashboard');

export default api;
