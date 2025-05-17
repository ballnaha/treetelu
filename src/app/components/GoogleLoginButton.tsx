'use client';

import React, { useState } from 'react';
import { Button, CircularProgress, Box, styled, Tooltip } from '@mui/material';
import Image from 'next/image';

interface GoogleLoginButtonProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  iconOnly?: boolean;
  tooltip?: string;
}

// สร้างปุ่มที่มี Style เฉพาะสำหรับ Google Login แบบเต็มปุ่ม
const GoogleButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '12px 24px',
  borderRadius: '30px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: '#ffffff',
  color: '#757575',
  border: '1px solid #DADCE0',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#f1f1f1',
  },
}));

// สร้างปุ่มที่มี Style เฉพาะสำหรับ Google Login แบบไอคอนวงกลม
const CircleGoogleButton = styled(Button)(({ theme }) => ({
  minWidth: '65px',
  width: '65px',
  height: '65px',
  borderRadius: '50%',
  padding: 0,
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: '#ffffff',
  border: '1px solid #DADCE0',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#f1f1f1',
  },
}));

export default function GoogleLoginButton({
  text = 'เข้าสู่ระบบด้วย Google',
  size = 'medium',
  className,
  iconOnly = false,
  tooltip = 'เข้าสู่ระบบด้วย Google',
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // เมื่อคลิกปุ่ม ให้ redirect ไปที่ endpoint Google OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
    }
  };

  const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;
  
  // ถ้าเป็นแบบไอคอนวงกลม
  if (iconOnly) {
    return (
      <Tooltip title={tooltip} arrow>
        <CircleGoogleButton
          type="button"
          variant="outlined"
          size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={className}
          aria-label="เข้าสู่ระบบด้วย Google"
        >
          {isLoading ? (
            <CircularProgress size={iconSize} color="inherit" />
          ) : (
            <Box sx={{ position: 'relative', width: 30, height: 30 }}>
              <Image
                src="/google-icon.svg"
                alt="Google"
                width={30}
                height={30}
              />
            </Box>
          )}
        </CircleGoogleButton>
      </Tooltip>
    );
  }

  // แบบปุ่มปกติ
  return (
    <GoogleButton
      type="button"
      variant="outlined"
      fullWidth
      size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={className}
      startIcon={
        isLoading ? (
          <CircularProgress size={iconSize} color="inherit" />
        ) : (
          <Box sx={{ position: 'relative', width: iconSize, height: iconSize, mr: 1 }}>
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={iconSize}
              height={iconSize}
            />
          </Box>
        )
      }
    >
      {isLoading ? 'กำลังโหลด...' : text}
    </GoogleButton>
  );
} 