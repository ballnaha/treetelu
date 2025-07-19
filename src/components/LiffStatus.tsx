'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Button,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import { 
  isInLiff, 
  isLiffLoggedIn, 
  getLiffProfile, 
  liffLogin,
  closeLiffWindow 
} from '@/utils/liffUtils';
import { useAuth } from '@/context/AuthContext';

export default function LiffStatus() {
  const { user } = useAuth();
  const [liffInfo, setLiffInfo] = useState({
    isInLiff: false,
    isLoggedIn: false,
    profile: null as any,
    error: null as string | null
  });

  useEffect(() => {
    const checkLiffStatus = async () => {
      try {
        const inLiff = isInLiff();
        setLiffInfo(prev => ({ ...prev, isInLiff: inLiff }));

        if (inLiff && typeof window !== 'undefined' && window.liff) {
          const loggedIn = isLiffLoggedIn();
          setLiffInfo(prev => ({ ...prev, isLoggedIn: loggedIn }));

          if (loggedIn) {
            const profile = await getLiffProfile();
            setLiffInfo(prev => ({ ...prev, profile }));
          }
        }
      } catch (error) {
        setLiffInfo(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' 
        }));
      }
    };

    checkLiffStatus();
  }, []);

  const handleLiffLogin = () => {
    liffLogin();
  };

  const handleCloseLiff = () => {
    closeLiffWindow();
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          สถานะ LINE LIFF
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              สภาพแวดล้อม:
            </Typography>
            <Chip 
              label={liffInfo.isInLiff ? 'ใน LINE LIFF' : 'ไม่ใช่ LINE LIFF'} 
              color={liffInfo.isInLiff ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              สถานะการล็อกอิน LIFF:
            </Typography>
            <Chip 
              label={liffInfo.isLoggedIn ? 'ล็อกอินแล้ว' : 'ยังไม่ล็อกอิน'} 
              color={liffInfo.isLoggedIn ? 'success' : 'warning'}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              สถานะการล็อกอินระบบ:
            </Typography>
            <Chip 
              label={user?.isLoggedIn ? 'ล็อกอินแล้ว' : 'ยังไม่ล็อกอิน'} 
              color={user?.isLoggedIn ? 'success' : 'error'}
              size="small"
            />
          </Box>

          {liffInfo.profile && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ข้อมูลโปรไฟล์ LIFF:
                </Typography>
                <Typography variant="body2">
                  <strong>ชื่อ:</strong> {liffInfo.profile.displayName}
                </Typography>
                <Typography variant="body2">
                  <strong>User ID:</strong> {liffInfo.profile.userId}
                </Typography>
                {liffInfo.profile.pictureUrl && (
                  <Box sx={{ mt: 1 }}>
                    <img 
                      src={liffInfo.profile.pictureUrl} 
                      alt="Profile" 
                      style={{ width: 50, height: 50, borderRadius: '50%' }}
                    />
                  </Box>
                )}
              </Box>
            </>
          )}

          {user?.isLoggedIn && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ข้อมูลผู้ใช้ระบบ:
                </Typography>
                <Typography variant="body2">
                  <strong>ชื่อ:</strong> {user.name}
                </Typography>
                <Typography variant="body2">
                  <strong>อีเมล:</strong> {user.email}
                </Typography>
                <Typography variant="body2">
                  <strong>ประเภท:</strong> {user.isLineUser ? 'ผู้ใช้ LINE' : 'ผู้ใช้ทั่วไป'}
                </Typography>
              </Box>
            </>
          )}

          {liffInfo.error && (
            <Alert severity="error">
              {liffInfo.error}
            </Alert>
          )}

          <Divider />
          
          <Stack direction="row" spacing={2}>
            {liffInfo.isInLiff && !liffInfo.isLoggedIn && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleLiffLogin}
                size="small"
              >
                ล็อกอิน LIFF
              </Button>
            )}
            
            {liffInfo.isInLiff && (
              <Button 
                variant="outlined" 
                onClick={handleCloseLiff}
                size="small"
              >
                ปิดหน้าต่าง
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}