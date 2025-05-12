"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Snackbar, Alert, AlertTitle, Typography, Box } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface User {
  id?: string | number;
  name: string;
  email?: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isLineUser?: boolean;
  token?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, csrfToken?: string) => void;
  logout: (redirectMessage?: string, errorType?: string) => Promise<void>;
  isLoading: boolean;
  getAuthToken: () => string | null;
  getCsrfToken: () => string | null;
  loginWithLine: () => void;
  checkAuthAndLogout: (response: Response) => Promise<boolean>;
  showAuthErrorSnackbar: (message: string, errorType?: string) => void;
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
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorType, setErrorType] = useState<string>('auth_error');
  const isAdmin = user?.isAdmin || false;

  // ดึงข้อมูลผู้ใช้จาก localStorage เมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    const getUserFromStorage = () => {
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            // ตรวจสอบว่าข้อมูลเปลี่ยนแปลงจริงๆ ก่อนเรียก setUser
            if (JSON.stringify(parsedUser) !== JSON.stringify(user)) {
              setUser(parsedUser);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    getUserFromStorage();
    
    // ไม่ต้องให้ getUserFromStorage ทำงานทุกครั้งที่ user เปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []);

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const login = (userData: User, csrfToken?: string) => {
    console.log('AuthContext: login with data:', userData);
    
    // ตรวจสอบและแก้ไขข้อมูล avatar
    if (userData.avatar === undefined || userData.avatar === 'undefined' || userData.avatar === 'null') {
      console.log('Fixing undefined avatar in login data');
      userData.avatar = '';
    }
    
    // ทำการเปรียบเทียบกับข้อมูลที่มีอยู่แล้ว เพื่อป้องกัน re-render ที่ไม่จำเป็น
    const existingUserData = localStorage.getItem('user');
    if (existingUserData) {
      try {
        const existingUser = JSON.parse(existingUserData);
        // ตรวจสอบว่าข้อมูลเปลี่ยนแปลงหรือไม่
        if (
          existingUser.id === userData.id &&
          existingUser.name === userData.name &&
          existingUser.isLoggedIn === userData.isLoggedIn &&
          existingUser.isAdmin === userData.isAdmin &&
          existingUser.isLineUser === userData.isLineUser &&
          existingUser.token === userData.token
        ) {
          console.log('User data unchanged, skipping update');
          return; // ข้ามการอัปเดตถ้าข้อมูลไม่เปลี่ยนแปลง
        }
      } catch (e) {
        console.error('Error parsing existing user data:', e);
      }
    }
    
    // บันทึกข้อมูลใหม่
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    // เก็บ CSRF token ถ้ามี
    if (csrfToken) {
      localStorage.setItem('csrf_token', csrfToken);
    }
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const logout = async (redirectMessage?: string, errorType?: string) => {
    try {
      // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่
      const userData = localStorage.getItem('user');
      const isLineUser = userData ? JSON.parse(userData)?.isLineUser : false;
      
      // ลบข้อมูลทั้งหมดออกจาก localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
      
      // ลบ cookie ด้วย
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setUser(null);
      
      // จากนั้นจึงส่งคำขอไปยัง API
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });

        if (!response.ok) {
          console.error('Logout failed with status:', response.status);
        }
      } catch (apiError) {
        console.error('Logout API error:', apiError);
        // ไม่ต้อง return ออกจากฟังก์ชันหลัก ให้ทำการ redirect ต่อไปได้
      }
      
      // สำหรับผู้ใช้ LINE ให้ redirect ไปยังหน้า login เสมอ
      // สำหรับผู้ใช้ทั่วไป ใช้ errorType ในการกำหนดหน้าปลายทาง
      const redirectUrl = isLineUser || errorType === 'line_logout'
        ? '/login'
        : errorType 
          ? `/login?error_type=${errorType}` 
          : '/login';
      
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // กรณีเกิดข้อผิดพลาดก็ให้ redirect ไปยังหน้า login
      window.location.href = '/login';
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

  // ฟังก์ชันสำหรับแสดง Snackbar แจ้งเตือนปัญหาการ authenticate
  const showAuthErrorSnackbar = (message: string, type: string = 'auth_error') => {
    setAuthErrorMessage(message);
    setErrorType(type);
    setShowErrorSnackbar(true);
  };

  // ฟังก์ชันสำหรับปิด Snackbar
  const handleCloseSnackbar = () => {
    setShowErrorSnackbar(false);
  };

  // ฟังก์ชันสำหรับตรวจสอบสถานะการตอบกลับจาก API และทำ auto logout ถ้าพบข้อผิดพลาด 401
  const checkAuthAndLogout = async (response: Response): Promise<boolean> => {
    if (response.status === 401) {
      console.log('Authentication failed (401), auto logout triggered');
      
      // สร้างข้อความตามประเภทผู้ใช้
      const message = user?.isAdmin
        ? 'กรุณาเข้าสู่ระบบผู้ดูแลระบบอีกครั้ง'
        : 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
      
      // แสดง Snackbar แจ้งเตือน พร้อมระบุประเภทข้อผิดพลาด
      showAuthErrorSnackbar(message, 'session_expired');
      
      // หน่วงเวลาเล็กน้อยเพื่อให้ Snackbar แสดงผลก่อน
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ทำการ logout โดยส่งข้อความเดียวกันไปแสดงในหน้า login
      await logout(message, 'session_expired');
      return false;
    }
    return true;
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    getAuthToken,
    getCsrfToken,
    checkAuthAndLogout,
    showAuthErrorSnackbar,
    loginWithLine: () => {
      // ตรงนี้ใส่โค้ดสำหรับการล็อกอินด้วย LINE
      window.location.href = '/api/auth/line';
    }
  };

  // ปรับข้อความหัวแจ้งเตือนตามประเภทข้อผิดพลาด
  const getAlertTitle = () => {
    if (errorType === 'session_expired') {
      return isAdmin ? 'เซสชันผู้ดูแลระบบหมดอายุ' : 'เซสชันหมดอายุ';
    } else if (errorType === 'invalid_credentials') {
      return 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง';
    }
    return isAdmin ? 'แจ้งเตือนผู้ดูแลระบบ' : 'แจ้งเตือนการเข้าสู่ระบบ';
  };

  // ฟังก์ชันสำหรับกำหนด severity ของ Alert ตามประเภทข้อผิดพลาด
  const getAlertSeverity = () => {
    if (errorType === 'session_expired') {
      return 'warning';
    } else if (errorType === 'invalid_credentials') {
      return 'error';
    }
    return 'error';
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Snackbar แจ้งเตือนปัญหาการ authenticate */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={isAdmin ? 3000 : 2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={getAlertSeverity()} 
          variant="filled"
          icon={
            errorType === 'session_expired' 
              ? <AccessTimeIcon fontSize="large" /> 
              : <ErrorOutlineIcon fontSize="large" />
          }
          sx={{ 
            width: 'auto',
            minWidth: '300px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
            py: 1.5,
            px: 2,
            backgroundColor: errorType === 'session_expired' ? '#ff9800' : '#d32f2f'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {errorType === 'session_expired' ? 
              <AccessTimeIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> : 
              <ErrorOutlineIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            }
            <AlertTitle sx={{ m: 0, fontWeight: 600, fontSize: '1rem' }}>
              {getAlertTitle()}
            </AlertTitle>
          </Box>
          <Typography variant="body1" sx={{ fontSize: '0.95rem' }}>
            {errorType === 'session_expired' 
              ? 'เซสชันของท่านหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อดำเนินการต่อ'
              : errorType === 'invalid_credentials'
                ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง'
                : authErrorMessage
            }
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
            {errorType === 'session_expired' ? 'กำลังนำท่านไปยังหน้าเข้าสู่ระบบ...' : ''}
          </Typography>
        </Alert>
      </Snackbar>
      
      {children}
    </AuthContext.Provider>
  );
} 