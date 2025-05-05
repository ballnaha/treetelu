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
  Fade
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { validateEmail } from '@/utils/validationUtils';
import KeyIcon from '@mui/icons-material/Key';

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

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // ตรวจสอบการ hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateForm = () => {
    let isValid = true;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'อีเมลไม่ถูกต้อง');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    return isValid;
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน');
      }
    } catch (err) {
      console.error('Error in forgot password:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  // ป้องกัน hydration error โดยรอให้คอมโพเนนต์ mount ก่อน
  if (!isMounted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, minHeight: '80vh' }}>
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <KeyIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      </Box>
      <PageTitle variant="h4">ลืมรหัสผ่าน</PageTitle>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4,
          fontSize: '1rem',
          fontFamily: 'inherit'
        }}
      >
        ป้อนอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
      </Typography>
      
      <FormContainer>
        {isSuccess ? (
          <Fade in={isSuccess}>
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity="success" 
                sx={{ mb: 3 }}
              >
                ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว! กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการต่อ
              </Alert>
              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                ถ้าคุณไม่เห็นอีเมลในกล่องขาเข้า กรุณาตรวจสอบในโฟลเดอร์สแปมด้วย
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button 
                  component={Link} 
                  href="/login" 
                  variant="outlined" 
                  color="primary"
                >
                  กลับไปที่หน้าเข้าสู่ระบบ
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
              id="email"
              label="อีเมล"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={isSubmitting}
              margin="normal"
              required
              placeholder="กรอกอีเมลที่ใช้ลงทะเบียน"
              InputProps={{
                startAdornment: (
                  <MailOutlineIcon color="action" sx={{ mr: 1 }} />
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
                  <CircularProgress size={20} color="inherit" thickness={5} sx={{ mr: 1 }} />
                  กำลังส่งลิงก์รีเซ็ต
                </>
              ) : (
                'ขอลิงก์รีเซ็ตรหัสผ่าน'
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