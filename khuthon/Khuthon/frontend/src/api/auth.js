import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const { user } = await api.me();
          setUser(user);
        } catch {
          await AsyncStorage.removeItem('token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    await AsyncStorage.setItem('token', token);
    setUser(user);
  };

  const signup = async (email, password, nickname) => {
    const { token, user } = await api.signup(email, password, nickname);
    await AsyncStorage.setItem('token', token);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
