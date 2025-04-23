"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  Link as MuiLink,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { validateEmail } from '@/utils/validationUtils';

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

export default function RegisterClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Fix hydration issues by ensuring component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form validation states
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
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
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
      isValid = false;
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
      isValid = false;
    }
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'อีเมลไม่ถูกต้อง';
      isValid = false;
    }
    
    // Validate password
    if (formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      isValid = false;
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Make API call to register endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
      // Handle validation errors
      if (data.errors) {
        // Update field-specific errors
        const newErrors = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        };
        
        data.errors.forEach((err: { path: string[], message: string }) => {
          if (err.path && err.path.length > 0) {
            const field = err.path[0] as keyof typeof newErrors;
            if (field in newErrors) {
              newErrors[field] = err.message;
            }
          }
        });
        
        setErrors(newErrors);
        setError(data.error || 'กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
        return;
      }
      
      // Handle other errors
      setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      return;
    }
    
    // Success - data contains { message, user }
    if (data.message) {
      setSuccess(true);
      setError(null);
      
      // Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body1">
              สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </Typography>
          </Alert>
          <CircularProgress size={40} sx={{ mt: 2 }} />
        </Box>
      </Container>
    );
  }
  
  // Prevent layout shift during hydration
  if (!isMounted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, minHeight: '80vh' }}>
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <PageTitle variant="h4">สมัครสมาชิก</PageTitle>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4,
          fontSize: '1rem',
          fontFamily: 'inherit'
        }}
      >
        สมัครสมาชิกเพื่อรับสิทธิพิเศษและติดตามสถานะการสั่งซื้อ
      </Typography>
      
      <FormContainer>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="ชื่อ"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="นามสกุล"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="อีเมล"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="รหัสผ่าน"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'}
            required
            sx={{ mb: 3 }}
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
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
            sx={{ mb: 4 }}
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
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonOutlineIcon />}
          >
            {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </StyledButton>
        </form>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontFamily: 'inherit',
              fontSize: '0.875rem'
            }}
          >
            มีบัญชีอยู่แล้ว?{' '}
            <MuiLink 
              component={Link} 
              href="/login" 
              color="primary" 
              sx={{ 
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'none',
                  color: theme => theme.palette.primary.dark
                }
              }}
            >
              เข้าสู่ระบบ
            </MuiLink>
          </Typography>
        </Box>
      </FormContainer>
    </Container>
  );
}
