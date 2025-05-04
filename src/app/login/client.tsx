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
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { validateEmail } from '@/utils/validationUtils';
import { useAuth } from '@/context/AuthContext';

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

// LINE Login Button
const LineLoginButton = styled(Button)(({ theme }) => ({
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

export default function LoginClient() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { login, user } = useAuth();
  const [lineLoginUrl, setLineLoginUrl] = useState('');
  
  // Fix hydration issues by ensuring component is mounted
  useEffect(() => {
    setIsMounted(true);
    
    // รับค่า LINE Login URL จาก environment variable หรือใช้ค่าเริ่มต้น
    const lineClientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID || '';
    const lineRedirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || 'http://localhost:3001/api/auth/line';
    
    // สร้าง LINE Login URL
    const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineClientId}&redirect_uri=${encodeURIComponent(lineRedirectUri)}&state=12345&scope=profile&bot_prompt=normal`;
    setLineLoginUrl(loginUrl);
  }, []);
  
  // ถ้าผู้ใช้ล็อกอินอยู่แล้ว ให้เปลี่ยนหน้าไปที่หน้าหลัก
  useEffect(() => {
    if (isMounted && user?.isLoggedIn) {
      router.replace('/');
    }
  }, [isMounted, user, router]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form validation states
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (name === 'rememberMe') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
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
    }
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'อีเมลไม่ถูกต้อง';
      isValid = false;
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
      isValid = false;
    }
    
    setErrors(newErrors);
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
      // Make API call to login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login response data:', data);
        setSuccess(true);
        
        // เก็บ token ใน localStorage
        localStorage.setItem('auth_token', data.token);
        
        // เพิ่มการเก็บ token ใน cookie ด้วยเพื่อให้ middleware สามารถเข้าถึงได้
        document.cookie = `auth_token=${data.token}; path=/; max-age=${data.rememberMe ? 30*24*60*60 : 24*60*60}`;
        
        // ใช้ AuthContext แทนการใช้ localStorage โดยตรง
        const userData = {
          id: data.user.id,
          name: data.user.name,
          isLoggedIn: true,
          isAdmin: data.user.isAdmin,
          token: data.token // เก็บ token ใน userData ด้วย
        };
        
        console.log('User data for context:', userData);
        
        // ใช้ AuthContext และบันทึก CSRF token
        login(userData, data.csrfToken);
        
        // ตรวจสอบการเก็บ token
        console.log('Token saved to localStorage');
        if (data.csrfToken) {
          console.log('CSRF Token received and saved');
        }
        console.log('Redirecting after login...');
        
        if (userData.isAdmin) {
          console.log('User is admin, redirecting to admin products page...');
          window.location.href = '/admin/products?auth=token';
        } else {
          window.location.href = '/';
        }
      } else {
        const data = await response.json();
        setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิด LINE Login
  const handleLineLogin = () => {
    if (lineLoginUrl) {
      window.location.href = lineLoginUrl;
    }
  };
  
  // Prevent layout shift during hydration
  if (!isMounted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, minHeight: '80vh' }}>
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <PageTitle variant="h4">เข้าสู่ระบบ</PageTitle>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4,
          fontSize: '1rem',
          fontFamily: 'inherit'
        }}
      >
        เข้าสู่ระบบเพื่อจัดการบัญชีและติดตามคำสั่งซื้อของคุณ
      </Typography>
      
      <FormContainer>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* แบบที่ 1: วางปุ่ม LINE Login ไว้ด้านบนของฟอร์ม */}
        <Box sx={{ mb: 3 }}>
          <LineLoginButton
            type="button"
            variant="contained"
            fullWidth
            size="large"
            onClick={handleLineLogin}
            sx={{ 
              backgroundColor: '#06C755',
              '&:hover': {
                backgroundColor: '#05a949',
              }
            }}
          >
            เข้าสู่ระบบด้วย LINE
          </LineLoginButton>
        </Box>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            หรือเข้าสู่ระบบด้วยอีเมล
          </Typography>
        </Divider>
        
        <form onSubmit={handleSubmit}>
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
            helperText={errors.password}
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  name="rememberMe"
                  color="primary"
                />
              }
              label={<Typography sx={{ fontFamily: 'inherit', fontSize: '0.9rem' }}>จดจำฉัน</Typography>}
              sx={{ mb: 2 }}
            />
            
            <MuiLink 
              component={Link} 
              href="/forgot-password" 
              color="primary"
              sx={{ 
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              ลืมรหัสผ่าน?
            </MuiLink>
          </Box>
          
          <StyledButton
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            sx={{ mb: 2 }}
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
            ยังไม่มีบัญชี?{' '}
            <MuiLink 
              component={Link} 
              href="/register" 
              color="primary" 
              sx={{ 
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'none',
                  color: theme => theme.palette.primary.dark
                }
              }}
            >
              สมัครสมาชิก
            </MuiLink>
          </Typography>
        </Box>
      </FormContainer>
    </Container>
  );
}

// ถ้าต้องการใช้แบบที่ 3: Tabs ให้เพิ่มเข้าไปในโค้ดส่วนหัวของ component
// const [loginMethod, setLoginMethod] = useState(0);

// function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
//   const { children, value, index, ...other } = props;
//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`login-tabpanel-${index}`}
//       aria-labelledby={`login-tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box>{children}</Box>}
//     </div>
//   );
// }

// function a11yProps(index: number) {
//   return {
//     id: `login-tab-${index}`,
//     'aria-controls': `login-tabpanel-${index}`,
//   };
// }
