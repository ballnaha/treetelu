"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Container, Backdrop } from '@mui/material';
import { useAuth } from '@/context/AuthContext';

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('กำลังเข้าสู่ระบบ...');
  const [isLineUser, setIsLineUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted || hasProcessed) return;
    
    const processLogin = async () => {
      try {
        setHasProcessed(true);
        
        setLoadingMessage('กำลังตรวจสอบข้อมูลการเข้าสู่ระบบ...');
        
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const isAdmin = searchParams.get('isAdmin') === 'true';
        const csrfToken = searchParams.get('csrfToken');
        const avatarRaw = searchParams.get('avatar');
        const lineUser = searchParams.get('isLineUser') === 'true';
        const googleUser = searchParams.get('isGoogleUser') === 'true';
        
        setIsLineUser(lineUser);
        setIsGoogleUser(googleUser);
        
        let avatar = '';
        if (avatarRaw && avatarRaw !== 'undefined' && avatarRaw !== 'null' &&
            (!avatarRaw.includes('profile.line-scdn.net') && !avatarRaw.includes('obs.line-scdn.net'))) {
          avatar = avatarRaw;
          console.log("Got valid avatar URL:", avatar);
        } else {
          console.log("Avatar URL is invalid or from LINE, ignoring:", avatarRaw);
        }
        
        if (!token || !userId || !name) {
          setError('ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
          setLoading(false);
          return;
        }
        
        setLoadingMessage('กำลังบันทึกข้อมูลการเข้าสู่ระบบ...');
        
        localStorage.setItem('auth_token', token);
        
        document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
        
        const userData = {
          id: userId,
          name: name,
          isLoggedIn: true,
          isAdmin: isAdmin,
          token: token,
          isLineUser: lineUser,
          isGoogleUser: googleUser,
          avatar: avatar
        };
        
        login(userData, csrfToken || '');
        
        setLoadingMessage('กำลังนำคุณไปยังหน้าหลัก...');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
      } catch (err: any) {
        console.error('Login callback error:', err);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง');
        setLoading(false);
      }
    };
    
    processLogin();
  }, [isMounted, hasProcessed, searchParams, login, router]);
  
  if (!isMounted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography>
            <a href="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
              กลับไปยังหน้าเข้าสู่ระบบ
            </a>
          </Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <>
      <Backdrop
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
        }}
        open={loading}
      >
        <CircularProgress
          color="primary"
          size={70}
          thickness={4}
          sx={{ 
            mb: 3,
            color: isLineUser ? '#06C755' : isGoogleUser ? '#4285F4' : '#1976d2'
          }}
        />
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>
          {loadingMessage}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.7 }}>
          กรุณารอสักครู่...
        </Typography>
      </Backdrop>
      
      <Container maxWidth="sm" sx={{ 
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 3,
      }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img 
            src={isGoogleUser ? "/google-icon.svg" : "/images/line-badge.png"} 
            alt={isGoogleUser ? "Google Login" : "LINE Login"} 
            style={{ 
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              marginBottom: '16px'
            }} 
          />
          <Typography variant="h5" gutterBottom>
            กำลังดำเนินการเข้าสู่ระบบ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ระบบกำลังตรวจสอบข้อมูลของคุณ
          </Typography>
        </Box>
        <CircularProgress thickness={4} />
      </Container>
    </>
  );
} 