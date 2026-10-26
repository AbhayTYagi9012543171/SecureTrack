
import axios from 'axios';

const DEVELOPMENT_API_URL = 'http://localhost:5000/api/v1';
const PRODUCTION_API_URL =
  'https://securetrack-bbh6.onrender.com/api/v1';

function normalizeUrl(url) {
  return url.trim().replace(/\/+$/, '');
}

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;

  // Use the configured backend URL in both development and production.
  if (configuredUrl?.trim()) {
    return normalizeUrl(configuredUrl);
  }

  if (import.meta.env.DEV) {
    return DEVELOPMENT_API_URL;
  }

  // Fallback for the current separate Render services.
  return PRODUCTION_API_URL;
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
    const requestUrl = error.config?.url || '';

    const isAuthPage =
      /\/(login|register|forgot-password|reset-password)(\/|$)/i.test(
        window.location.pathname
      );

    const isSessionCheck =
      /\/auth\/me(?:\?|$)/i.test(requestUrl);

    if (
      status === 401 &&
      !isAuthPage &&
      !isSessionCheck &&
      !unauthorizedEventSent
    ) {
      unauthorizedEventSent = true;

      window.dispatchEvent(
        new Event('securetrack:unauthorized')
      );
    }

    if (!error.response) {
      error.message =
        error.code === 'ECONNABORTED'
          ? 'SecureTrack API request timed out.'
          : 'Unable to connect to SecureTrack API. Check backend URL and CORS configuration.';

      if (import.meta.env.DEV) {
        console.error('[SecureTrack API Error]', {
          baseURL: API_BASE_URL,
          requestURL: requestUrl,
          error: error.message,
        });
      }
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
    const healthUrl = new URL(API_BASE_URL);
    healthUrl.pathname = '/health';
    healthUrl.search = '';

    const response = await axios.get(healthUrl.toString(), {
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
