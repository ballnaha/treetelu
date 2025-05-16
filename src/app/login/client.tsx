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
  AlertTitle,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { styled } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { validateEmail } from '@/utils/validationUtils';
import { useAuth } from '@/context/AuthContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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

// สร้าง component แยกสำหรับแสดงข้อความแจ้งเตือนสำหรับ session หมดอายุ
const SessionExpiredAlert = () => (
  <Alert 
    severity="warning"
    sx={{ 
      mb: 3, 
      borderRadius: 1.5, 
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      '& .MuiAlert-icon': {
        fontSize: '1.3rem'
      },
      backgroundColor: '#fff8e1',
      borderLeft: '4px solid #ffa000'
    }}
    icon={<AccessTimeIcon fontSize="inherit" />}
  >
    <AlertTitle sx={{ 
      fontSize: '1rem', 
      fontWeight: 600,
      color: '#b78300'
    }}>
      เซสชันหมดอายุ
    </AlertTitle>
    <Typography 
      variant="body2" 
      sx={{ 
        mt: 0.5,
        lineHeight: 1.5
      }}
    >
      เซสชันของท่านหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง
    </Typography>
  </Alert>
);

// สร้าง component แยกสำหรับแสดงข้อความแจ้งเตือนสำหรับรหัสผ่านไม่ถูกต้อง
const InvalidCredentialsAlert = () => (
  <Alert 
    severity="error"
    sx={{ 
      mb: 3, 
      borderRadius: 1.5, 
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      '& .MuiAlert-icon': {
        fontSize: '1.3rem'
      },
      backgroundColor: '#fdecea',
      borderLeft: '4px solid #d32f2f'
    }}
    icon={<ErrorOutlineIcon fontSize="inherit" />}
  >
    <AlertTitle sx={{ 
      fontSize: '1rem', 
      fontWeight: 600,
      color: '#c62828'
    }}>
      ข้อมูลเข้าสู่ระบบไม่ถูกต้อง
    </AlertTitle>
    <Typography 
      variant="body2" 
      sx={{ 
        mt: 0.5,
        lineHeight: 1.5
      }}
    >
      อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง
    </Typography>
  </Alert>
);

// สร้าง component แยกสำหรับแสดงข้อความแจ้งเตือนทั่วไป
const GeneralErrorAlert = ({ message }: { message: string }) => (
  <Alert 
    severity="error"
    sx={{ 
      mb: 3, 
      borderRadius: 1.5, 
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      '& .MuiAlert-icon': {
        fontSize: '1.3rem'
      }
    }}
  >
    <AlertTitle sx={{ fontSize: '1rem', fontWeight: 500 }}>
      แจ้งเตือน
    </AlertTitle>
    <Typography variant="body2" sx={{ mt: 0.5 }}>
      {message}
    </Typography>
  </Alert>
);

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const { login, user } = useAuth();
  const [lineLoginUrl, setLineLoginUrl] = useState('');
  
  // Fix hydration issues by ensuring component is mounted
  useEffect(() => {
    setIsMounted(true);
    
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
    
    // ---------- แก้ไขส่วนการตรวจสอบ URL parameters ----------
    // ดักแยกการแสดงผล error อย่างชัดเจน
    const errorType = searchParams.get('error_type');
    
    // ทำตรรกะแยกชัดเจน
    if (errorType === 'session_expired') {
      // กรณี session หมดอายุ
      setError({
        message: '', // ไม่ต้องใช้ข้อความจาก URL
        type: 'session_expired'
      });
    } 
    else if (errorType === 'invalid_credentials') {
      // กรณีรหัสผ่านผิด
      setError({
        message: '', // ไม่ต้องใช้ข้อความจาก URL
        type: 'invalid_credentials'
      });
    }
    else {
      // กรณีอื่นๆ ดูที่ข้อความ
      const message = searchParams.get('message');
      if (message) {
        const decodedMessage = decodeURIComponent(message);
        
        // พยายามวิเคราะห์ประเภท error จากข้อความ
        if (decodedMessage.includes('เซสชัน') || decodedMessage.includes('หมดอายุ')) {
          setError({
            message: '',
            type: 'session_expired'
          });
        }
        else if (decodedMessage.includes('อีเมล') || decodedMessage.includes('รหัสผ่าน')) {
          setError({
            message: '',
            type: 'invalid_credentials'
          });
        }
        else {
          // กรณีอื่นๆ ให้แสดงข้อความจาก URL
          setError({
            message: decodedMessage,
            type: 'auth_error'
          });
        }
      }
      }
    } catch (err: any) {
      // ข้อผิดพลาดจากการเชื่อมต่อ
      setError({
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง',
        type: 'system_error'
      });
      console.error('Login error:', err);
    }
  }, [searchParams]);
  
  // ถ้าผู้ใช้ล็อกอินอยู่แล้ว ให้เปลี่ยนหน้าไปที่หน้าหลัก
  useEffect(() => {
    if (isMounted && user?.isLoggedIn) {
      router.replace('/');
    }
  }, [isMounted, user, router]);
  
  // สร้าง interface สำหรับ error state
  interface AuthError {
    message: string;
    type: string;
  }

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
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
        document.cookie = `auth_token=${data.token}; path=/; max-age=${formData.rememberMe ? 30*24*60*60 : 24*60*60}`;
        
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
        // ล็อกอินไม่สำเร็จ
        const data = await response.json();
        
        // ตรวจสอบประเภทข้อผิดพลาด
        if (data.error_type === 'invalid_credentials') {
          // แจ้งเตือนรหัสผ่านไม่ถูกต้อง
          setError({
            message: '', // ไม่ใช้ข้อความจาก response เพื่อป้องกันการปนกัน
            type: 'invalid_credentials'
          });
        } else {
          // ข้อผิดพลาดอื่นๆ
          setError({
            message: data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
            type: 'auth_error'
          });
        }
      }
    } catch (err: any) {
      // ข้อผิดพลาดจากการเชื่อมต่อ
      setError({
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง',
        type: 'system_error'
      });
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิด LINE Login
  const handleLineLogin = () => {
    try {
      // ตรวจสอบว่ามีการตั้งค่า LINE_CLIENT_ID หรือไม่
      const lineClientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
      
      if (!lineClientId) {
        // แสดงข้อความผิดพลาดหากไม่มีการตั้งค่า CLIENT_ID
        setError({
          message: 'ระบบเข้าสู่ระบบด้วย LINE ยังไม่ได้รับการตั้งค่า โปรดติดต่อผู้ดูแลระบบ',
          type: 'auth_error'
        });
        return;
      }
      
    if (lineLoginUrl) {
      window.location.href = lineLoginUrl;
      } else {
        setError({
          message: 'ไม่สามารถเชื่อมต่อกับ LINE ได้ในขณะนี้ โปรดลองอีกครั้งในภายหลัง',
          type: 'auth_error'
        });
      }
    } catch (error) {
      console.error('LINE login error:', error);
      setError({
        message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE',
        type: 'auth_error'
      });
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
          <>
            {error.type === 'session_expired' && <SessionExpiredAlert />}
            {error.type === 'invalid_credentials' && <InvalidCredentialsAlert />}
            {error.type !== 'session_expired' && error.type !== 'invalid_credentials' && (
              <GeneralErrorAlert message={error.message} />
            )}
          </>
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
          </Box>
          
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            startIcon={!isSubmitting ? <LoginIcon /> : null}
            disabled={isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                กำลังเข้าสู่ระบบ
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </StyledButton>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink 
              component={Link} 
              href="/forgot-password" 
              variant="body2"
              underline="hover"
              color="primary"
            >
              ลืมรหัสผ่าน?
            </MuiLink>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ display: 'inline' }}>
              ยังไม่มีบัญชี? 
            </Typography>
            <MuiLink 
              component={Link} 
              href="/register" 
              variant="body2"
              underline="hover"
              color="primary"
              sx={{ ml: 0.5 }}
            >
              สมัครสมาชิก
            </MuiLink>
          </Box>
        </form>
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
