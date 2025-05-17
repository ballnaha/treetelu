'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Stack,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Badge,
  Chip,
  List,
  ListItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SecurityIcon from '@mui/icons-material/Security';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import BadgeIcon from '@mui/icons-material/Badge';
import { formatThaiDate } from '@/utils/dateUtils';
import Link from 'next/link';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/imageUtils';

// สร้าง interface สำหรับข้อมูลผู้ใช้
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isAdmin?: string | boolean;
  isLineUser?: boolean; // เพิ่มฟิลด์เพื่อบ่งชี้ว่าเป็นผู้ใช้ LINE หรือไม่
  isGoogleUser?: boolean; // เพิ่มฟิลด์เพื่อบ่งชี้ว่าเป็นผู้ใช้ Google หรือไม่
  lineId?: string; // เพิ่ม lineId
  googleId?: string; // เพิ่ม googleId
  avatar?: string; // เพิ่ม avatar
}

// กำหนดแท็บในหน้าโปรไฟล์
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

export default function ProfileClient() {
  const { user, isLoading: authLoading, logout, login, checkAuthAndLogout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // สถานะสำหรับข้อมูลโปรไฟล์
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // สถานะสำหรับฟอร์มเปลี่ยนรหัสผ่าน
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // ตรวจสอบการล็อกอิน
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // ดึงข้อมูลโปรไฟล์เมื่อมีการล็อกอิน
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);
  
  // ฟังก์ชันดึงข้อมูลโปรไฟล์
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // เพิ่มการจัดการกรณีเกิดข้อผิดพลาดในการเรียก API
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // ตรวจสอบสถานะการตอบกลับและทำ auto logout ถ้าจำเป็น
        const authValid = await checkAuthAndLogout(response);
        if (!authValid) {
          return; // ถ้าถูก logout ไปแล้ว ให้หยุดการทำงานของฟังก์ชัน
        }
        
        // ตรวจสอบ content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON จาก API');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('API error:', data);
          throw new Error(data.message || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
        }
        
        // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่จากอีเมล
        const isLineUser = data.user.email?.includes('@lineuser.treetelu.com') || user?.isLineUser || !!data.user.lineId;
        const isGoogleUser = user?.isGoogleUser || data.user.googleId; // เพิ่มการตรวจสอบผู้ใช้ Google
        data.user.isLineUser = isLineUser;
        data.user.isGoogleUser = isGoogleUser; // เพิ่มค่า isGoogleUser เข้าไปในข้อมูลผู้ใช้
        
        setProfile(data.user);
        setEditedProfile(data.user);
        setError('');
      } catch (fetchError: any) {
        console.error('Error fetching profile from API:', fetchError);
        
        // สร้างข้อมูลจำลองในกรณีที่ API ยังไม่พร้อมใช้งาน
        if (user) {
          // ตรวจสอบว่าเป็นผู้ใช้ LINE หรือไม่
          const isLineUser = typeof user.isLineUser === 'boolean' ? user.isLineUser : false;
          const isGoogleUser = typeof user.isGoogleUser === 'boolean' ? user.isGoogleUser : false; // เพิ่มการตรวจสอบ Google User
          
          const mockProfile: UserProfile = {
            id: typeof user.id === 'number' ? user.id : Number(user.id) || 1,
            firstName: (user.name?.split(' ')[0]) || 'ผู้ใช้',
            lastName: (user.name?.split(' ')[1]) || 'ทดสอบ',
            email: user.email || 'user@example.com',
            createdAt: new Date().toISOString(),
            isAdmin: user.isAdmin,
            isLineUser: isLineUser, // ใช้ค่าที่มาจาก auth context
            isGoogleUser: isGoogleUser, // เพิ่ม isGoogleUser
            avatar: user.avatar // เพิ่ม avatar
          };
          
          setProfile(mockProfile);
          setEditedProfile(mockProfile);
          //console.log('Using mock profile data:', mockProfile);
          
          // แสดงข้อผิดพลาดแต่ไม่ทำให้แอปพลิเคชันหยุดทำงาน
          setError('ไม่สามารถเชื่อมต่อกับ API ได้ กำลังแสดงข้อมูลเบื้องต้น');
        } else {
          throw new Error('ไม่มีข้อมูลผู้ใช้');
        }
      }
    } catch (err: any) {
      console.error('Error in profile loading process:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์');
    } finally {
      setLoading(false);
    }
  };
  
  // เปลี่ยนค่าแท็บ
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // เริ่มการแก้ไขโปรไฟล์
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  // ยกเลิกการแก้ไขโปรไฟล์
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };
  
  // บันทึกข้อมูลโปรไฟล์ที่แก้ไข
  const handleSaveProfile = async () => {
    try {
      if (!editedProfile) return;
      
      setLoading(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName
        }),
        credentials: 'include'
      });
      
      // ตรวจสอบสถานะการตอบกลับและทำ auto logout ถ้าจำเป็น
      const authValid = await checkAuthAndLogout(response);
      if (!authValid) {
        return; // ถ้าถูก logout ไปแล้ว ให้หยุดการทำงานของฟังก์ชัน
      }
      
      if (!response.ok) {
        throw new Error('ไม่สามารถอัปเดตโปรไฟล์ได้');
      }
      
      const data = await response.json();
      
      setProfile(data.user);
      setEditedProfile(data.user);
      setIsEditing(false);
      
      // อัปเดตชื่อผู้ใช้ใน AuthContext เพื่อแสดงบน navbar
      if (user) {
        // อัปเดตข้อมูลผู้ใช้แต่คงค่า properties อื่นๆ เดิมไว้
        const updatedUser = {
          ...user,
          name: `${data.user.firstName} ${data.user.lastName}`
        };
        login(updatedUser);
        console.log('Updated user in AuthContext:', updatedUser);
      }
      
      setSnackbar({
        open: true,
        message: 'อัปเดตโปรไฟล์สำเร็จ',
        severity: 'success'
      });
    } catch (apiError: any) {
      console.error('API error when saving profile:', apiError);
      
      // ในกรณีที่ API ไม่ทำงาน ให้ใช้ข้อมูลที่ผู้ใช้แก้ไข
      setProfile(editedProfile);
      setIsEditing(false);
      
      // อัปเดตชื่อผู้ใช้ใน AuthContext เพื่อแสดงบน navbar ในกรณีออฟไลน์
      if (user && editedProfile) {
        // อัปเดตข้อมูลผู้ใช้แต่คงค่า properties อื่นๆ เดิมไว้
        const updatedUser = {
          ...user,
          name: `${editedProfile.firstName} ${editedProfile.lastName}`
        };
        login(updatedUser);
        console.log('Updated user in AuthContext (offline mode):', updatedUser);
      }
      
      setSnackbar({
        open: true,
        message: 'บันทึกข้อมูลในโหมดออฟไลน์',
        severity: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // บันทึกการเปลี่ยนรหัสผ่าน
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้องของข้อมูล
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    
    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      setPasswordErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordForm),
        credentials: 'include'
      });
      
      // ตรวจสอบสถานะการตอบกลับและทำ auto logout ถ้าจำเป็น
      const authValid = await checkAuthAndLogout(response);
      if (!authValid) {
        return; // ถ้าถูก logout ไปแล้ว ให้หยุดการทำงานของฟังก์ชัน
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
      
      // รีเซ็ตฟอร์ม
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSnackbar({
        open: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error changing password:', err);
      
      setSnackbar({
        open: true,
        message: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // อัปเดตข้อมูลที่แก้ไข
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedProfile) return;
    
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };
  
  // อัปเดตข้อมูลฟอร์มเปลี่ยนรหัสผ่าน
  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
    
    // รีเซ็ตข้อความข้อผิดพลาด
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };
  
  // ปิด Snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // ย้าย useEffect ไปไว้ด้านบนก่อนที่จะมีการ return
  useEffect(() => {
    if (profile) {
      //console.log('Profile data:', profile);
      //console.log('Avatar URL:', profile.avatar);
      
      // ตรวจสอบว่า avatar URL มีค่าที่ใช้งานได้หรือไม่
      if (profile.avatar && profile.avatar !== 'undefined' && profile.avatar !== 'null') {
        // ข้ามการ preload รูปจาก LINE เพราะไม่สามารถดึงได้
        if (!profile.avatar.includes('profile.line-scdn.net') && !profile.avatar.includes('obs.line-scdn.net')) {
          try {
            // พยายามโหลดรูปภาพท้องถิ่นก่อนที่จะแสดงใน UI
            const img = document.createElement('img');
            img.onload = () => {
              console.log("Avatar image preloaded successfully");
            };
            img.onerror = () => {
              console.log("Failed to preload avatar image");
            };
            img.src = getValidImageUrl(profile.avatar);
          } catch (e) {
            console.error("Error preloading avatar image:", e);
          }
        } else {
          console.log("Avatar is from LINE, skipping preload");
        }
      } else {
        console.log("Avatar URL is not available");
      }
    }
  }, [profile]);
  
  // แสดงตัวโหลดถ้ากำลังตรวจสอบการล็อกอิน
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // ถ้ายังไม่ได้ล็อกอิน จะถูกเปลี่ยนเส้นทางโดย useEffect
  if (!user) {
    return null;
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        minHeight: '80vh',
      }}>
        {/* ส่วนซ้าย: ข้อมูลโปรไฟล์ */}
        <Box sx={{ 
          width: { xs: '100%', md: '320px' },
          flexShrink: 0,
        }}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              overflow: 'hidden',
              position: 'sticky',
              top: 100,
            }}
          >
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              position: 'relative',
              pb: 0
            }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: 60, 
                  bgcolor: profile?.isLineUser ? '#06C755' : 'primary.main',
                  opacity: 0.9
                }} 
              />
              
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  profile?.isLineUser ? 
                  <Box 
                    component="img" 
                    src="/images/line-badge.png" 
                    alt="LINE User" 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%',
                      border: '2px solid white',
                      bgcolor: 'white'
                    }} 
                    onError={(e) => {
                      console.error('Error loading LINE badge:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  /> : null
                }
                sx={{ mt: 2, zIndex: 1 }}
              >
                {profile?.avatar && profile.avatar !== 'undefined' && profile.avatar !== 'null' ? (
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      border: '3px solid white',
                      overflow: 'hidden',
                      bgcolor: theme => profile?.isLineUser ? '#06C755' : theme.palette.primary.main,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}
                  >
                    <Box
                      component="img"
                      src={getValidImageUrl(profile.avatar)}
                      alt={profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        console.error('Error loading avatar image:', e);
                        (e.target as HTMLImageElement).style.display = 'none';
                        
                        // แสดงไอคอนแทนเมื่อโหลดรูปไม่สำเร็จ
                        const iconElement = document.createElement('div');
                        iconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="50" viewBox="0 0 24 24" width="50"><path d="M0 0h24v24H0z" fill="none"/><path fill="white" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                        
                        // เพิ่มไอคอนเข้าไปในพื้นที่แสดงรูป
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.appendChild(iconElement);
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Avatar
                    sx={{ 
                      width: 90, 
                      height: 90,
                      border: '3px solid white',
                      bgcolor: theme => profile?.isLineUser ? '#06C755' : theme.palette.primary.main,
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    }}
                  >
                    {profile ? (
                      profile.isLineUser ? (
                        <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                      ) : (
                        `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
                      )
                    ) : (
                      <PersonIcon sx={{ fontSize: 40 }} />
                    )}
                  </Avatar>
                )}
              </Badge>
              
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600, fontSize: { xs: '1.5rem', md: '1.25rem' } }}>
                {profile ? `${profile.firstName} ${profile.lastName}` : 'ผู้ใช้'}
              </Typography>
              
  
              
              {profile?.isLineUser && (
                <Chip 
                  label="ผู้ใช้งานผ่าน LINE" 
                  color="success" 
                  size="small" 
                  sx={{ 
                    bgcolor: '#06C755', 
                    color: 'white',
                    mt: 1.5,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 22
                  }}
                />
              )}
              
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 1.5
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5 }} />
                สมาชิกตั้งแต่: {profile?.createdAt ? formatThaiDate(new Date(profile.createdAt)) : '-'}
              </Typography>
            </Box>
            
            <Box sx={{ p: 3, pt: 2.5 }}>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <Button
                    fullWidth
                    component={Link}
                    href="/order-history"
                    startIcon={<ShoppingBagIcon />}
                    color="inherit"
                    sx={{ 
                      justifyContent: 'flex-start', 
                      py: 1,
                      fontWeight: 400,
                      textTransform: 'none',
                      color: 'text.primary'
                    }}
                  >
                    ประวัติคำสั่งซื้อ
                  </Button>
                </ListItem>
                
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <Button
                    fullWidth
                    onClick={() => {
                      if (profile?.isLineUser) {
                        logout('', 'line_logout');
                      } else if (profile?.isGoogleUser) {
                        logout('', 'google_logout');
                      } else {
                        logout();
                      }
                    }}
                    startIcon={<LogoutIcon sx={{ color: 'error.main' }} />}
                    color="inherit"
                    sx={{ 
                      justifyContent: 'flex-start', 
                      py: 1,
                      fontWeight: 400,
                      textTransform: 'none',
                      color: 'error.main',
                      "&:hover": {
                        bgcolor: 'error.lighter',
                      }
                    }}
                  >
                    ออกจากระบบ
                  </Button>
                </ListItem>
              </List>
            </Box>
          </Card>
        </Box>
        
        {/* ส่วนขวา: แท็บข้อมูลและการแก้ไข */}
        <Box sx={{ flex: 1 }}>
          {error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ 
                pb: 2, 
                mb: 3, 
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 500, color: 'text.primary', fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                  ข้อมูลโปรไฟล์
                </Typography>
              </Box>
              
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                      aria-label="profile tabs"
                      variant={isMobile ? "fullWidth" : "standard"}
                      sx={{
                        minHeight: 48,
                        '& .MuiTab-root': {
                          fontWeight: 500,
                          fontSize: '0.9rem',
                          textTransform: 'none',
                          minHeight: 48,
                          py: 1.5
                        }
                      }}
                    >
                      <Tab 
                        label="ข้อมูลส่วนตัว" 
                        icon={<BadgeIcon sx={{ fontSize: 18 }} />} 
                        iconPosition="start" 
                        {...a11yProps(0)} 
                      />
                      {!profile?.isLineUser && !profile?.isGoogleUser ? (
                        <Tab 
                          label="รหัสผ่าน" 
                          icon={<SecurityIcon sx={{ fontSize: 18 }} />} 
                          iconPosition="start" 
                          {...a11yProps(1)} 
                        />
                      ) : null}
                    </Tabs>
                  </Box>
                  
                  <Box sx={{ p: 4 }}>
                    <TabPanel value={tabValue} index={0}>
                      <form>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                          gap: 3
                        }}>
                          <TextField
                            fullWidth
                            label="ชื่อ"
                            name="firstName"
                            value={editedProfile?.firstName || ''}
                            onChange={handleProfileChange}
                            disabled={isEditing ? false : true}
                            variant="outlined"
                            InputProps={{
                              sx: { borderRadius: 1 }
                            }}
                          />
                          <TextField
                            fullWidth
                            label="นามสกุล"
                            name="lastName"
                            value={editedProfile?.lastName || ''}
                            onChange={handleProfileChange}
                            disabled={isEditing ? false : true}
                            variant="outlined"
                            InputProps={{
                              sx: { borderRadius: 1 }
                            }}
                          />
                          <TextField
                            fullWidth
                            label="อีเมล"
                            name="email"
                            value={editedProfile?.email || ''}
                            disabled={true}
                            variant="outlined"
                            sx={{ gridColumn: '1 / -1' }}
                            InputProps={{
                              sx: { borderRadius: 1 }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                          {!isEditing ? (
                            !profile?.isLineUser && !profile?.isGoogleUser && (
                              <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleEditProfile}
                                startIcon={<EditIcon />}
                                size="medium"
                                sx={{ 
                                  borderRadius: 1,
                                  fontWeight: 500,
                                  textTransform: 'none',
                                  px: 2
                                }}
                              >
                                แก้ไขข้อมูล
                              </Button>
                            )
                          ) : (
                            <Stack direction="row" spacing={2}>
                              <Button 
                                variant="outlined" 
                                onClick={handleCancelEdit}
                                size="medium"
                                sx={{ 
                                  borderRadius: 1,
                                  textTransform: 'none',
                                  fontWeight: 500
                                }}
                              >
                                ยกเลิก
                              </Button>
                              <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSaveProfile}
                                disabled={loading}
                                size="medium"
                                sx={{ 
                                  borderRadius: 1,
                                  textTransform: 'none',
                                  fontWeight: 500
                                }}
                              >
                                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                              </Button>
                            </Stack>
                          )}
                        </Box>
                      </form>
                    </TabPanel>
                    
                    {!profile?.isLineUser && !profile?.isGoogleUser && (
                      <TabPanel value={tabValue} index={1}>
                        <form onSubmit={handleChangePassword}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                              fullWidth
                              label="รหัสผ่านปัจจุบัน"
                              name="currentPassword"
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordFormChange}
                              error={!!passwordErrors.currentPassword}
                              helperText={passwordErrors.currentPassword}
                              variant="outlined"
                              InputProps={{
                                sx: { borderRadius: 1 }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="รหัสผ่านใหม่"
                              name="newPassword"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordFormChange}
                              error={!!passwordErrors.newPassword}
                              helperText={passwordErrors.newPassword}
                              variant="outlined"
                              InputProps={{
                                sx: { borderRadius: 1 }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="ยืนยันรหัสผ่านใหม่"
                              name="confirmPassword"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordFormChange}
                              error={!!passwordErrors.confirmPassword}
                              helperText={passwordErrors.confirmPassword}
                              variant="outlined"
                              InputProps={{
                                sx: { borderRadius: 1 }
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                              type="submit" 
                              variant="contained" 
                              color="primary"
                              disabled={loading}
                              size="medium"
                              sx={{ 
                                borderRadius: 1,
                                textTransform: 'none',
                                fontWeight: 500
                              }}
                            >
                              {loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
                            </Button>
                          </Box>
                        </form>
                      </TabPanel>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      </Box>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} elevation={6} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 