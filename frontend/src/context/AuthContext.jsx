import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshPromise = useRef(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;
    refreshPromise.current = api.get('/auth/me')
      .then((response) => {
        const currentUser = response.data?.data?.user ?? null;
        if (mounted.current) setUser(currentUser);
        return currentUser;
      })
      .catch((error) => {
        if (mounted.current) setUser(null);
        // The /auth/me endpoint is a public session probe. Network/server errors
        // should not crash the app; the UI can still show the signed-out state.
        if (!error.response) console.error('SecureTrack API is unreachable. Check the backend and VITE_API_URL.');
        return null;
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
        refreshPromise.current = null;
      });
    return refreshPromise.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('securetrack:unauthorized', onUnauthorized);
    return () => {
      mounted.current = false;
      window.removeEventListener('securetrack:unauthorized', onUnauthorized);
    };
  }, [refresh]);

  const login = useCallback(async (values) => {
    const response = await api.post('/auth/login', values);
    const currentUser = response.data?.data?.user;
    setUser(currentUser || null);
    return response.data;
  }, []);

  const register = useCallback(async (values) => {
    const response = await api.post('/auth/register', values);
    const currentUser = response.data?.data?.user;
    setUser(currentUser || null);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
