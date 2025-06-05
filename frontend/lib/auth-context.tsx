'use client';

import type React from 'react';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from './api-service';
import Cookies from 'js-cookie';

type User = {
  id: string;
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Set the token in the API service
        apiService.setAccessToken(accessToken);

        // Get user profile
        const userData = await apiService.getUserProfile();
        setUser(userData);
      } catch (error) {
        // Try to refresh the token
        try {
          await refreshToken();
        } catch (refreshError) {
          // If refresh fails, clear everything
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    // Set cookies with appropriate options
    Cookies.set('accessToken', accessToken, {
      secure: true,
      sameSite: 'lax',
    });
    Cookies.set('refreshToken', refreshToken, {
      secure: true,
      sameSite: 'lax',
    });
    apiService.setAccessToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    apiService.clearAccessToken();
    setUser(null);
    router.push('/login');
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.refreshToken(refreshToken);
      Cookies.set('accessToken', response.access, {
        secure: true,
        sameSite: 'lax',
      });
      Cookies.set('refreshToken', response.refresh, {
        secure: true,
        sameSite: 'lax',
      });
      apiService.setAccessToken(response.access);
      setUser(response.user);
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
