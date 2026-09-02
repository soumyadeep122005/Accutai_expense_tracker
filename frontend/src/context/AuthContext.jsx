import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('accutai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('accutai_token'));
  const [loading, setLoading] = useState(true);

  // Check URL query parameters for Google OAuth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('accutai_token', urlToken);
      setToken(urlToken);
      // Clean query params from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch / verify user details whenever token changes
  useEffect(() => {
    async function verifyUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        localStorage.setItem('accutai_user', JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to verify token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifyUser();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('accutai_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('accutai_unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('accutai_token', data.access_token);
    localStorage.setItem('accutai_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const createdUser = await api.register(username, email, password);
    // Automatically log in after registration
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('accutai_token');
    localStorage.removeItem('accutai_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('accutai_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
