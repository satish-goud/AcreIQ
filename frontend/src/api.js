import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const fetchHealth = () => api.get('/api/health');
export const fetchLocalities = () => api.get('/api/localities');
export const fetchProperties = (params = {}) => api.get('/api/properties', { params });
export const predictPrice = (data) => api.post('/api/predict-price', data);

export const createProperty = ({ files = [], ...property }) => {
  const data = new FormData();

  Object.entries(property).forEach(([key, value]) => {
    data.append(key, value ?? '');
  });

  files.forEach((file) => data.append('files', file));

  return api.post('/api/properties', data);
};

export const fetchLocalityTrend = (locality) =>
  api.get(`/api/localities/${encodeURIComponent(locality)}/trend`);

export default api;