"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  Link as MuiLink,
  CircularProgress,
  Fade,
  InputAdornment,
  IconButton
} from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { styled } from '@mui/material/styles';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Styled components
const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  position: 'relative',
  paddingBottom: theme.spacing(2),
  fontFamily: 'inherit',
  color: theme.palette.text.primary,
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 80,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '12px 24px',
  borderRadius: '30px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    backgroundColor: theme.palette.primary.dark,
  },
}));

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  // รับพารามิเตอร์จาก URL
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  // ตรวจสอบการ hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ตรวจสอบความถูกต้องของโทเค็นเมื่อโหลดหน้า
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setIsTokenValid(false);
        setIsTokenChecked(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setIsTokenValid(false);
      } finally {
        setIsTokenChecked(true);
      }
    };

    verifyToken();
  }, [token, email]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate password
    if (formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
      isValid = false;
    } else {
      newErrors.password = '';
    }
    
    // Validate confirm password
    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'รหัสผ่านยืนยันไม่ตรงกัน';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // ส่งคำขอรีเซ็ตรหัสผ่านไปยัง API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (err) {
      console.error('Error in reset password:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ป้องกัน hydration error
  if (!isMounted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, minHeight: '80vh' }}>
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  // รอการตรวจสอบโทเค็น
  if (!isTokenChecked) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, minHeight: '60vh' }}>
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <CircularProgress size={40} thickness={5} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isTokenValid) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <PageTitle variant="h4">ลิงก์ไม่ถูกต้อง</PageTitle>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 4,
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        >
          ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว
        </Typography>
        
        <FormContainer>
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่
            </Typography>
            <Button 
              component={Link} 
              href="/forgot-password" 
              variant="contained" 
              color="primary"
            >
              ขอลิงก์รีเซ็ตรหัสผ่านใหม่
            </Button>
          </Box>
        </FormContainer>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <LockResetIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      </Box>
      <PageTitle variant="h4">รีเซ็ตรหัสผ่าน</PageTitle>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4,
          fontSize: '1rem',
          fontFamily: 'inherit'
        }}
      >
        กรุณากำหนดรหัสผ่านใหม่ของคุณ
      </Typography>
      
      <FormContainer>
        {isSuccess ? (
          <Fade in={isSuccess}>
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="success" 
                sx={{ mb: 3 }}
              >
                รีเซ็ตรหัสผ่านสำเร็จแล้ว! คุณสามารถใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button 
                  component={Link} 
                  href="/login" 
                  variant="contained" 
                  color="primary"
                >
                  ไปที่หน้าเข้าสู่ระบบ
                </Button>
              </Box>
            </Box>
          </Fade>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              id="password"
              name="password"
              label="รหัสผ่านใหม่"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'}
              disabled={isSubmitting}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="ยืนยันรหัสผ่านใหม่"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isSubmitting}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  กำลังเปลี่ยนรหัสผ่าน
                </>
              ) : (
                'เปลี่ยนรหัสผ่าน'
              )}
            </StyledButton>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <MuiLink 
                component={Link} 
                href="/login" 
                variant="body2" 
                underline="hover"
                color="primary"
              >
                กลับไปที่หน้าเข้าสู่ระบบ
              </MuiLink>
            </Box>
          </form>
        )}
      </FormContainer>
    </Container>
  );
} 