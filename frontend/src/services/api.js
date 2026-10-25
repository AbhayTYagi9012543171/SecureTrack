import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let unauthorizedEventSent = false;
api.interceptors.response.use(
  (response) => {
    unauthorizedEventSent = false;
    return response;
  },
  (error) => {
    const path = window.location.pathname;
    const isAuthPage = /\/(login|register|forgot-password|reset-password)(\/|$)/i.test(path);
    const isSessionProbe = /\/auth\/me(?:\?|$)/i.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthPage && !isSessionProbe && !unauthorizedEventSent) {
      unauthorizedEventSent = true;
      window.dispatchEvent(new Event('securetrack:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export async function getData(url, params) {
  const response = await api.get(url, { params });
  return response.data?.data;
}

export async function send(method, url, data, config = {}) {
  const normalizedMethod = String(method).toLowerCase();
  if (!['post', 'put', 'patch', 'delete'].includes(normalizedMethod)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }
  const response = normalizedMethod === 'delete'
    ? await api.delete(url, { ...config, ...(data === undefined ? {} : { data }) })
    : await api[normalizedMethod](url, data, config);
  return response.data;
}

export default api;
