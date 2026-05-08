import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';

const AuthContext = createContext(null);
const STORAGE_TIMEOUT_MS = 3000;

function withTimeout(promise, timeoutMs, fallback = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

async function getStoredToken() {
  return await withTimeout(AsyncStorage.getItem('token'), STORAGE_TIMEOUT_MS, null);
}

async function setStoredToken(token) {
  await withTimeout(AsyncStorage.setItem('token', token), STORAGE_TIMEOUT_MS);
}

async function removeStoredToken() {
  await withTimeout(AsyncStorage.removeItem('token'), STORAGE_TIMEOUT_MS);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          try {
            const { user } = await api.me();
            if (mounted) setUser(user);
          } catch {
            await removeStoredToken();
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setUser(user);
    await setStoredToken(token);
  };

  const signup = async (email, password, nickname) => {
    const { token, user } = await api.signup(email, password, nickname);
    setUser(user);
    await setStoredToken(token);
  };

  const logout = async () => {
    setUser(null);
    await removeStoredToken();
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
