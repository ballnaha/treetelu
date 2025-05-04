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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;
    
    const processLogin = async () => {
      try {
        // แสดงสถานะกำลังดำเนินการ
        setLoadingMessage('กำลังตรวจสอบข้อมูลการเข้าสู่ระบบ...');
        
        // รับพารามิเตอร์จาก URL
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const isAdmin = searchParams.get('isAdmin') === 'true';
        const csrfToken = searchParams.get('csrfToken');
        const avatarRaw = searchParams.get('avatar');
        const lineUser = searchParams.get('isLineUser') === 'true';
        setIsLineUser(lineUser);
        
        // สำหรับ LINE avatar ให้เป็นค่าว่าง เนื่องจากไม่สามารถใช้งานได้
        let avatar = '';
        if (avatarRaw && avatarRaw !== 'undefined' && avatarRaw !== 'null' &&
            !avatarRaw.includes('profile.line-scdn.net') && !avatarRaw.includes('obs.line-scdn.net')) {
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
        
        // อัพเดทสถานะ
        setLoadingMessage('กำลังบันทึกข้อมูลการเข้าสู่ระบบ...');
        
        // เก็บ token ใน localStorage
        localStorage.setItem('auth_token', token);
        
        // เก็บ token ใน cookie ด้วย
        document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
        
        // ใช้ AuthContext สำหรับการเข้าสู่ระบบ
        const userData = {
          id: userId,
          name: name,
          isLoggedIn: true,
          isAdmin: isAdmin,
          token: token,
          isLineUser: lineUser, // เพิ่มเพื่อระบุว่าเป็นผู้ใช้ LINE
          avatar: avatar // เพิ่มข้อมูล avatar ที่ผ่านการตรวจสอบแล้ว
        };
        
        // เข้าสู่ระบบผ่าน Context
        login(userData, csrfToken || '');
        
        // อัพเดทสถานะ
        setLoadingMessage('กำลังนำคุณไปยังหน้าหลัก...');
        
        // รอสักครู่เพื่อให้เห็น loading message
        setTimeout(() => {
          // เปลี่ยนเส้นทางไปยังหน้าแรกเสมอ
          window.location.href = '/';
        }, 1000);
        
      } catch (err: any) {
        console.error('LINE login callback error:', err);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง');
        setLoading(false);
      }
    };
    
    processLogin();
  }, [isMounted, searchParams, login, router]);
  
  // ป้องกัน hydration issues
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
      {/* Full-page loading overlay */}
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
            color: isLineUser ? '#06C755' : '#1976d2' // สีเขียวสำหรับ LINE login, สีน้ำเงินสำหรับปกติ
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
        {/* เนื้อหาปกติ (จะถูกซ่อนด้วย overlay) */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img 
            src="/images/line-badge.png" 
            alt="LINE Login" 
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