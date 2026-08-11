// app/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser } from '../(api)/auth/authApi';
import { tokenCache } from '@/lib/auth';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        const storedToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
        if (storedToken) {
          console.log('Found stored token, setting auth state');
          setToken(storedToken);
        } else {
          console.log('No stored token found during initialization');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login process...');
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const response = await loginUser({ email, password });
      
      if (response.data.token) {
        setToken(response.data.token);
        router.replace("/(root)/(tabs)/home");
      }
    } catch (error: any) {
      console.error('Login error in context:', error);
      Alert.alert('Login Failed', error.message);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
      }

      const response = await registerUser({ name, email, password, phone });
      
      if (response.data.token) {
        setToken(response.data.token);
        router.replace("/(auth)/sign-in");
      }
    } catch (error: any) {
      console.error('Registration error in context:', error);
      Alert.alert('Registration Failed', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await tokenCache.removeToken(AUTH_TOKEN_KEY);
      const token = await tokenCache.getToken(AUTH_TOKEN_KEY); 
      if (!token) {
        console.log("Token has been removed successfully.");
      } else {
        console.warn("Token removal failed, token still exists.");
      }
      setToken(null);
      router.replace("/(auth)/sign-in");
  
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'An error occurred during logout');
    }
  };
  

  if (loading) {
    return null; // Anda bisa menampilkan loading spinner di sini
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
