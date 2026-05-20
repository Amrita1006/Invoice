import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'https://invoice-yccg.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadInvoice = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/invoices/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const saveInvoice = async (invoiceData) => {
  const response = await api.post('/invoices/save', invoiceData);
  return response.data;
};

export const getInvoiceHistory = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/invoices/history', { params: { search, page, limit } });
  return response.data;
};

export const getInvoice = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const downloadExcel = (id) => {
  window.open(`${API_BASE}/invoices/download/${id}`, '_blank');
};

export const previewExcel = (id) => {
  window.open(`${API_BASE}/invoices/preview/${id}`, '_blank');
};

export default api;