'use client';

import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Box, styled } from '@mui/material';

interface LineLoginButtonProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// styled component สำหรับปุ่ม LINE
const LineButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#06C755',
  color: 'white',
  fontWeight: 500,
  textTransform: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#06b14d',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  },
  '&.Mui-disabled': {
    backgroundColor: '#06C755',
    opacity: 0.75,
  }
}));

const LineLoginButton: React.FC<LineLoginButtonProps> = ({ 
  text = 'เข้าสู่ระบบด้วย LINE', 
  size = 'medium',
  className = ''
}) => {
  const { loginWithLine } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // ใช้ useEffect เพื่อป้องกัน hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // กำหนดขนาดของปุ่มตาม size ที่รับมา
  const buttonSizes = {
    small: { py: 0.75, px: 1.5, fontSize: '0.75rem', iconSize: 24 },
    medium: { py: 1, px: 2, fontSize: '0.875rem', iconSize: 28 },
    large: { py: 1.5, px: 3, fontSize: '1rem', iconSize: 32 }
  };
  const sizeClass = buttonSizes[size];
  
  const handleLogin = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    loginWithLine();
    
    // กรณีไม่มีการ redirect ภายใน 5 วินาที
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  // แสดงปุ่มเปล่าเพื่อรักษาโครงสร้างหน้าเว็บระหว่างการโหลด
  if (!isMounted) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: sizeClass.py * 16 + 40, 
          borderRadius: 1.5,
          backgroundColor: '#06C755'
        }}
      />
    );
  }
  
  return (
    <LineButton
      onClick={handleLogin}
      disabled={isLoading}
      fullWidth
      className={className}
      sx={{
        borderRadius: 1.5,
        py: sizeClass.py,
        px: sizeClass.px,
        fontSize: sizeClass.fontSize
      }}
      suppressHydrationWarning
    >
      {isLoading ? (
        <>
          <CircularProgress 
            size={20} 
            sx={{ color: 'white', mr: 1 }}
          />
          <span>กำลังดำเนินการ...</span>
        </>
      ) : (
        <>
          <Image 
            src="/images/line-icon.png" 
            alt="LINE" 
            width={sizeClass.iconSize} 
            height={sizeClass.iconSize}
            style={{ objectFit: 'contain' }}
          />
          {text}
        </>
      )}
    </LineButton>
  );
};

export default LineLoginButton; 