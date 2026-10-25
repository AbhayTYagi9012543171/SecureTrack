
import axios from 'axios';

/**
 * SecureTrack API Configuration
 *
 * Local development:
 *   http://localhost:5000/api/v1
 *
 * Production:
 *   https://your-backend.onrender.com/api/v1
 */

const DEVELOPMENT_API_URL = 'http://localhost:5000/api/v1';

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  // Use an explicit environment URL when available.
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  // Local fallback is only allowed during development.
  if (import.meta.env.DEV) {
    return DEVELOPMENT_API_URL;
  }

  // Production fallback supports same-origin API hosting.
  return `${window.location.origin}/api/v1`;
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/**
 * Request interceptor
 */
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.debug(
        `[SecureTrack API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url || ''}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 */
let unauthorizedEventSent = false;

api.interceptors.response.use(
  (response) => {
    unauthorizedEventSent = false;
    return response;
  },

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const currentPath = window.location.pathname;

    const isAuthPage =
      /\/(login|register|forgot-password|reset-password)(\/|$)/i.test(
        currentPath
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
      const message =
        error.code === 'ECONNABORTED'
          ? 'SecureTrack API request timed out.'
          : 'Unable to connect to SecureTrack API. Check backend URL, server status and CORS configuration.';

      error.message = message;

      if (import.meta.env.DEV) {
        console.error('[SecureTrack Network Error]', {
          apiBaseURL: API_BASE_URL,
          requestURL: requestUrl,
          error: error.message,
        });
      }
    }

    return Promise.reject(error);
  }
);

/**
 * GET helper
 */
export async function getData(url, params = {}) {
  const response = await api.get(url, { params });

  return response.data?.data;
}

/**
 * POST / PUT / PATCH / DELETE helper
 */
export async function send(method, url, data, config = {}) {
  const normalizedMethod = String(method).toLowerCase();

  const allowedMethods = [
    'post',
    'put',
    'patch',
    'delete',
  ];

  if (!allowedMethods.includes(normalizedMethod)) {
    throw new Error(
      `Unsupported HTTP method: ${method}`
    );
  }

  let response;

  if (normalizedMethod === 'delete') {
    response = await api.delete(url, {
      ...config,
      ...(data === undefined ? {} : { data }),
    });
  } else {
    response = await api[normalizedMethod](
      url,
      data,
      config
    );
  }

  return response.data;
}

/**
 * API health check
 */
export async function checkApiHealth() {
  try {
    const healthUrl = new URL(API_BASE_URL);

    // Remove the API prefix to access the backend health endpoint.
    healthUrl.pathname = '/health';
    healthUrl.search = '';

    const response = await axios.get(
      healthUrl.toString(),
      { timeout: 10000 }
    );

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
