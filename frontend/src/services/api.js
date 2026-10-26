
import axios from 'axios';

const DEVELOPMENT_API_URL = 'http://localhost:5000/api/v1';

function getApiBaseUrl() {
  // Local development uses the separately running backend.
  if (import.meta.env.DEV) {
    return (
      import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') ||
      DEVELOPMENT_API_URL
    );
  }

  // Production MUST use the same origin as the React application.
  // Do not point this to a second Render subdomain.
  return '/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

let unauthorizedEventSent = false;

api.interceptors.response.use(
  (response) => {
    unauthorizedEventSent = false;
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    const authPage =
      /\/(login|register|forgot-password|reset-password)(\/|$)/i
        .test(window.location.pathname);

    const sessionCheck = /\/auth\/me(?:\?|$)/i.test(url);

    if (
      status === 401 &&
      !authPage &&
      !sessionCheck &&
      !unauthorizedEventSent
    ) {
      unauthorizedEventSent = true;
      window.dispatchEvent(new Event('securetrack:unauthorized'));
    }

    if (!error.response) {
      error.message =
        error.code === 'ECONNABORTED'
          ? 'SecureTrack API request timed out.'
          : 'Unable to connect to SecureTrack. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export async function getData(url, params = {}) {
  const response = await api.get(url, { params });
  return response.data?.data;
}

export async function send(method, url, data, config = {}) {
  const normalizedMethod = String(method).toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(normalizedMethod)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  let response;

  if (normalizedMethod === 'delete') {
    response = await api.delete(url, {
      ...config,
      ...(data === undefined ? {} : { data }),
    });
  } else {
    response = await api[normalizedMethod](url, data, config);
  }

  return response.data;
}

export async function checkApiHealth() {
  try {
    const response = await axios.get('/health', {
      baseURL: window.location.origin,
      timeout: 10000,
    });

    return {
      online: response.status === 200,
      data: response.data,
    };
  } catch (error) {
    return {
      online: false,
      message: error.message,
    };
  }
}

export default api;
