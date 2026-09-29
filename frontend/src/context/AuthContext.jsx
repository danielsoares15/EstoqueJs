import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('estoque_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { user: userData, token } = res.data;
    setUser(userData);
    localStorage.setItem('estoque_user', JSON.stringify(userData));
    if (token) localStorage.setItem('estoque_token', token);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('estoque_user');
    localStorage.removeItem('estoque_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
