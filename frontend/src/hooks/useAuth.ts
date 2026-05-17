import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { User, AuthResponse } from '@/types';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>('/users/me');
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  return { user, login, register, logout, refreshUser, isAuthenticated: !!user };
}
