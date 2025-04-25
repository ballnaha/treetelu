"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id?: string | number;
  name: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, csrfToken?: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  getAuthToken: () => string | null;
  getCsrfToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้จาก localStorage เมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    const getUserFromStorage = () => {
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    getUserFromStorage();
  }, []);

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const login = (userData: User, csrfToken?: string) => {
    console.log('AuthContext: login with data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // เก็บ CSRF token ถ้ามี
    if (csrfToken) {
      localStorage.setItem('csrf_token', csrfToken);
    }
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const logout = async () => {
    try {
      // ลบข้อมูลทั้งหมดออกจาก localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
      
      // ลบ cookie ด้วย
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setUser(null);
      
      // จากนั้นจึงส่งคำขอไปยัง API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Logout failed with status:', response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ฟังก์ชันสำหรับดึง token
  const getAuthToken = (): string | null => {
    // ตรวจสอบจาก localStorage โดยตรงก่อน (มีความสำคัญมากกว่า)
    const token = localStorage.getItem('auth_token');
    if (token) return token;
    
    // ถ้าไม่มีใน localStorage ให้ลองดูใน user object
    if (user?.token) return user.token;
    
    return null;
  };

  // ฟังก์ชันสำหรับดึง CSRF token
  const getCsrfToken = (): string | null => {
    return localStorage.getItem('csrf_token');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    getAuthToken,
    getCsrfToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 