// client/src/context/AuthContext.jsx
// OWNER: Member 1 — PR required before modifying. Used by every page.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data.data);
      return res.data.data;
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
