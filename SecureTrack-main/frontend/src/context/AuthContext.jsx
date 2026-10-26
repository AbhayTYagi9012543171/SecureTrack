
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const mounted = useRef(false);
  const refreshPromise = useRef(null);

  /**
   * Update user only when component is mounted.
   */
  const updateUser = useCallback((nextUser) => {
    if (mounted.current) {
      setUser(nextUser);
    }
  }, []);

  /**
   * Check existing authentication session.
   */
  const refresh = useCallback(async () => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    refreshPromise.current = api
      .get('/auth/me')
      .then((response) => {
        const currentUser =
          response.data?.data?.user ?? null;

        updateUser(currentUser);
        setAuthError(null);

        return currentUser;
      })
      .catch((error) => {
        updateUser(null);

        const status = error.response?.status;

        if (!error.response) {
          setAuthError(
            'Unable to connect to SecureTrack API.'
          );

          if (import.meta.env.DEV) {
            console.error(
              'SecureTrack session check failed:',
              error.message
            );
          }
        } else if (status >= 500) {
          setAuthError(
            'SecureTrack server is temporarily unavailable.'
          );
        } else {
          setAuthError(null);
        }

        return null;
      })
      .finally(() => {
        if (mounted.current) {
          setLoading(false);
        }

        refreshPromise.current = null;
      });

    return refreshPromise.current;
  }, [updateUser]);

  /**
   * Login
   */
  const login = useCallback(async (values) => {
    setAuthError(null);

    try {
      const response = await api.post(
        '/auth/login',
        values
      );

      // Do not trust the login response alone: verify that the browser stored
      // the HttpOnly session cookie and sends it back on the next request.
      // This catches blocked/misconfigured cookies before protected pages load.
      const sessionResponse = await api.get('/auth/me');
      const currentUser = sessionResponse.data?.data?.user ?? null;

      if (!currentUser) {
        updateUser(null);
        throw new Error(
          'Login was accepted, but the browser did not send the SecureTrack session cookie. Check the production cookie and frontend-origin settings, then try again.'
        );
      }

      updateUser(currentUser);
      return { ...response.data, data: { ...response.data?.data, user: currentUser } };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';

      throw new Error(message);
    }
  }, [updateUser]);

  /**
   * Registration
   */
  const register = useCallback(async (values) => {
    setAuthError(null);

    try {
      const response = await api.post(
        '/auth/register',
        values
      );

      // Verify the newly-issued cookie before entering the protected app.
      const sessionResponse = await api.get('/auth/me');
      const currentUser = sessionResponse.data?.data?.user ?? null;

      if (!currentUser) {
        updateUser(null);
        throw new Error(
          'Account was created, but the browser did not retain the SecureTrack session cookie. Check the production cookie and frontend-origin settings, then sign in again.'
        );
      }

      updateUser(currentUser);
      return { ...response.data, data: { ...response.data?.data, user: currentUser } };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';

      throw new Error(message);
    }
  }, [updateUser]);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          'SecureTrack logout request failed:',
          error.message
        );
      }
    } finally {
      updateUser(null);
      setAuthError(null);
    }
  }, [updateUser]);

  /**
   * Initialize authentication.
   */
  useEffect(() => {
    mounted.current = true;

    refresh();

    const handleUnauthorized = () => {
      updateUser(null);
    };

    window.addEventListener(
      'securetrack:unauthorized',
      handleUnauthorized
    );

    return () => {
      mounted.current = false;

      window.removeEventListener(
        'securetrack:unauthorized',
        handleUnauthorized
      );
    };
  }, [refresh, updateUser]);

  const value = {
    user,
    loading,
    authError,

    isAuthenticated: Boolean(user),

    login,
    register,
    logout,
    refresh,

    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Authentication hook.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider.'
    );
  }

  return context;
}

export default AuthContext;
