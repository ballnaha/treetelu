'use client';

import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Box, styled, Tooltip } from '@mui/material';
import Image from 'next/image';

interface LineLoginButtonProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  iconOnly?: boolean;
  tooltip?: string;
}

// สร้างปุ่มที่มี Style เฉพาะสำหรับ LINE Login แบบเต็มปุ่ม
const LineButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '12px 24px',
  borderRadius: '30px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: '#06C755',
  color: '#ffffff',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#05a949',
  },
}));

// สร้างปุ่มที่มี Style เฉพาะสำหรับ LINE Login แบบไอคอนวงกลม
const CircleLineButton = styled(Button)(({ theme }) => ({
  minWidth: '65px',
  width: '65px',
  height: '65px',
  borderRadius: '50%',
  padding: 0,
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: '#06C755',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#05a949',
  },
}));

export default function LineLoginButton({
  text = 'เข้าสู่ระบบด้วย LINE',
  size = 'medium',
  className,
  iconOnly = false,
  tooltip = 'เข้าสู่ระบบด้วย LINE',
}: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lineLoginUrl, setLineLoginUrl] = useState('');

  useEffect(() => {
    try {
      // รับค่า LINE Login URL จาก environment variable หรือใช้ค่าเริ่มต้น
      const lineClientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || '';
      const lineRedirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || 'http://localhost:3001/api/auth/line/callback';
    
      if (lineClientId) {
        // สร้าง LINE Login URL เมื่อมีการตั้งค่า CLIENT_ID
        const state = Math.random().toString(36).substring(2);
        const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineClientId}&redirect_uri=${encodeURIComponent(lineRedirectUri)}&state=${state}&scope=profile&bot_prompt=normal`;
        setLineLoginUrl(loginUrl);
        
        // เก็บ state ใน session storage เพื่อตรวจสอบการ callback
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('line_auth_state', state);
        }
      }
    } catch (error) {
      console.error('LINE URL setup error:', error);
    }
  }, []);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      
      if (!lineLoginUrl) {
        console.error('LINE login URL is not available');
        setIsLoading(false);
        return;
      }
      
      // เมื่อคลิกปุ่ม ให้ redirect ไปที่ LINE OAuth
      window.location.href = lineLoginUrl;
    } catch (error) {
      console.error('LINE login error:', error);
      setIsLoading(false);
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;
  
  // ถ้าเป็นแบบไอคอนวงกลม
  if (iconOnly) {
    return (
      <Tooltip title={tooltip} arrow>
        <CircleLineButton
          type="button"
          variant="contained"
          size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
          onClick={handleLineLogin}
          disabled={isLoading}
          className={className}
          aria-label="เข้าสู่ระบบด้วย LINE"
        >
          {isLoading ? (
            <CircularProgress size={iconSize} color="inherit" />
          ) : (
            <Box sx={{ position: 'relative', width: 30, height: 30 }}>
              <Image
                src="/images/line-badge.png"
                alt="LINE"
                width={30}
                height={30}
              />
            </Box>
          )}
        </CircleLineButton>
      </Tooltip>
    );
  }

  // แบบปุ่มปกติ
  return (
    <LineButton
      type="button"
      variant="contained"
      fullWidth
      size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
      onClick={handleLineLogin}
      disabled={isLoading}
      className={className}
      startIcon={
        isLoading ? (
          <CircularProgress size={iconSize} color="inherit" />
        ) : (
          <Box sx={{ position: 'relative', width: iconSize, height: iconSize, mr: 1 }}>
            <Image
              src="/images/line-badge.png"
              alt="LINE"
              width={iconSize}
              height={iconSize}
            />
          </Box>
        )
      }
    >
      {isLoading ? 'กำลังโหลด...' : text}
    </LineButton>
  );
} 