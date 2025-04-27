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
  useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { formatThaiDate } from '@/utils/dateUtils';
import Link from 'next/link';
import Image from 'next/image';

// สร้าง interface สำหรับข้อมูลผู้ใช้
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isAdmin?: string | boolean;
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
  const { user, isLoading: authLoading, logout, login } = useAuth();
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
        
        // ตรวจสอบ content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON จาก API');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
        }
        
        setProfile(data.user);
        setEditedProfile(data.user);
        setError('');
      } catch (fetchError: any) {
        console.error('Error fetching profile from API:', fetchError);
        
        // สร้างข้อมูลจำลองในกรณีที่ API ยังไม่พร้อมใช้งาน
        if (user) {
          const mockProfile: UserProfile = {
            id: typeof user.id === 'number' ? user.id : 1,
            firstName: (user.name?.split(' ')[0]) || 'ผู้ใช้',
            lastName: (user.name?.split(' ')[1]) || 'ทดสอบ',
            email: 'user@example.com',
            createdAt: new Date().toISOString(),
            isAdmin: user.isAdmin
          };
          
          setProfile(mockProfile);
          setEditedProfile(mockProfile);
          console.log('Using mock profile data:', mockProfile);
          
          // แสดงข้อผิดพลาดแต่ไม่ทำให้แอปพลิเคชันหยุดทำงาน
          setError('ไม่สามารถเชื่อมต่อกับ API ได้ กำลังใช้ข้อมูลจำลอง');
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
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(editedProfile),
          credentials: 'include'
        });
        
        // ตรวจสอบ content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON จาก API');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
        }
        
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
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      setSnackbar({
        open: true,
        message: err.message || 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์',
        severity: 'error'
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* หัวข้อหน้า */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          โปรไฟล์ของฉัน
        </Typography>
        <Typography variant="body1" color="text.secondary">
          จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี
        </Typography>
      </Box>
      
      {/* แสดงข้อความข้อผิดพลาด */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* โปรไฟล์ผู้ใช้ */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={1}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: '250px' }}>
            <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              กำลังโหลดข้อมูลโปรไฟล์...
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* ส่วนหัวโปรไฟล์ */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'center', sm: 'flex-start' }, 
              mb: 3,
              gap: 2 
            }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {profile?.firstName?.charAt(0) || 'U'}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, textAlign: { xs: 'center', sm: 'left' } }}>
                  {profile?.firstName} {profile?.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  {profile?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                  สมาชิกตั้งแต่: {profile?.createdAt ? formatThaiDate(new Date(profile.createdAt)) : '-'}
                </Typography>
              </Box>
              
              <Button 
                component={Link} 
                href="/order-history" 
                variant="outlined" 
                sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
              >
                ดูประวัติคำสั่งซื้อ
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* แท็บสำหรับแสดงข้อมูลต่างๆ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="profile tabs"
                variant={isMobile ? 'fullWidth' : 'standard'}
              >
                <Tab icon={<PersonIcon />} label="ข้อมูลส่วนตัว" {...a11yProps(0)} />
                <Tab icon={<LockIcon />} label="เปลี่ยนรหัสผ่าน" {...a11yProps(1)} />
              </Tabs>
            </Box>
            
            {/* แท็บข้อมูลส่วนตัว */}
            <TabPanel value={tabValue} index={0}>
              <Box>
                {!isEditing ? (
                  <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            ชื่อ
                          </Typography>
                          <Typography variant="body1">
                            {profile?.firstName || '-'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            นามสกุล
                          </Typography>
                          <Typography variant="body1">
                            {profile?.lastName || '-'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            อีเมล
                          </Typography>
                          <Typography variant="body1">
                            {profile?.email || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleEditProfile}
                        startIcon={<EditIcon />}
                      >
                        แก้ไขข้อมูล
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box component="form">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <TextField
                          fullWidth
                          label="ชื่อ"
                          name="firstName"
                          value={editedProfile?.firstName || ''}
                          onChange={handleProfileChange}
                          required
                        />
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <TextField
                          fullWidth
                          label="นามสกุล"
                          name="lastName"
                          value={editedProfile?.lastName || ''}
                          onChange={handleProfileChange}
                          required
                        />
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                        <TextField
                          fullWidth
                          label="อีเมล"
                          name="email"
                          value={editedProfile?.email || ''}
                          onChange={handleProfileChange}
                          required
                          disabled // ไม่อนุญาตให้แก้ไขอีเมล
                          helperText="ไม่สามารถเปลี่ยนแปลงอีเมลได้"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancelEdit}
                        startIcon={<CancelIcon />}
                        disabled={loading}
                      >
                        ยกเลิก
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSaveProfile}
                        startIcon={loading ? undefined : <SaveIcon />}
                        disabled={loading}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                            กำลังบันทึก...
                          </Box>
                        ) : 'บันทึกข้อมูล'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            {/* แท็บเปลี่ยนรหัสผ่าน */}
            <TabPanel value={tabValue} index={1}>
              <Box component="form" onSubmit={handleChangePassword}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="รหัสผ่านปัจจุบัน"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordFormChange}
                      required
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="รหัสผ่านใหม่"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordFormChange}
                      required
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword || 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'}
                    />
                  </Box>
                  <Box>
                    <TextField
                      fullWidth
                      label="ยืนยันรหัสผ่านใหม่"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordFormChange}
                      required
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="submit"
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        กำลังบันทึก...
                      </Box>
                    ) : 'เปลี่ยนรหัสผ่าน'}
                  </Button>
                </Box>
              </Box>
            </TabPanel>
          </Box>
        )}
      </Paper>
      
      {/* Snackbar แสดงผลการทำงาน */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 