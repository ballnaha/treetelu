"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
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
  const login = (userData: User) => {
    console.log('AuthContext: login with data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const logout = async () => {
    try {
      // ลองทำลอง localStorage ออกก่อนเพื่อให้ UI อัพเดททันที
      localStorage.removeItem('user');
      setUser(null);
      
      // จากนั้นจึงส่งคำขอไปยัง API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Logout failed with status:', response.status);
        // ไม่ต้องตั้ง user กลับเพราะเราต้องการให้ UI อัพเดททันที
      }
    } catch (error) {
      console.error('Logout error:', error);
      // สิ่งสำคัญคือเราต้องแน่ใจว่า UI ยังคงอัพเดทแม้จะมีข้อผิดพลาด
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 