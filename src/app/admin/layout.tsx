'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  IconButton,
  AppBar,
  Toolbar,
  Slide,
  useScrollTrigger,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import LoadingSpinner from '@/components/LoadingSpinner';

// สร้าง styled component สำหรับ navigation
const StyledNavButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  padding: '6px 8px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

// ข้อมูลเมนู admin
const adminMenuItems = [
  { text: 'แดชบอร์ด', href: '/admin/dashboard', icon: <DashboardIcon /> },
  { text: 'คำสั่งซื้อ', href: '/admin/orders', icon: <ShoppingCartIcon /> },
  { text: 'สินค้า', href: '/admin/products', icon: <InventoryIcon /> },
  { text: 'ผู้ใช้งาน', href: '/admin/users', icon: <PeopleIcon /> },
  { text: 'ตั้งค่า', href: '/admin/settings', icon: <SettingsIcon /> },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบว่าเป็น admin หรือไม่
  useEffect(() => {
    if (user === null) {
      // ยังไม่โหลดข้อมูลผู้ใช้เสร็จ
      return;
    }
    
    if (!user?.isAdmin) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  // ฟังก์ชันเปิด/ปิดเมนูมือถือ
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // ฟังก์ชันปิดเมนูมือถือ
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <Slide appear={false} direction="down" in={true}>
        <AppBar position="fixed" color="transparent" elevation={2}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            zIndex: 1100,
          }}
        >
          <Toolbar>
            <Container maxWidth={false} sx={{ 
              px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
              maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1400px' }, 
              mx: 'auto',
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ position: "relative", width: 150, height: 48 }}>
                    <Link href="/">
                      <Image
                        src="/images/logo.webp"
                        alt="TreeTelu" 
                        width={150}
                        height={48}
                        style={{ objectFit: "contain" }}
                        priority
                      />
                    </Link>
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      ml: 2, 
                      fontWeight: 600, 
                      color: 'primary.main',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    ระบบผู้ดูแล
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {/* เมนูสำหรับจอใหญ่ */}
                  <Stack direction="row" spacing={2} sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}>
                    {adminMenuItems.map((item, index) => (
                      <StyledNavButton 
                        key={index} 
                        href={item.href}
                        startIcon={item.icon}
                        sx={{ 
                          color: 'text.primary',
                          '&:hover': {
                            color: 'primary.main',
                          }
                        }}
                      >
                        {item.text}
                      </StyledNavButton>
                    ))}
                  </Stack>
                  
                  {/* ปุ่มแฮมเบอร์เกอร์สำหรับเมนูมือถือ */}
                  <IconButton 
                    edge="start" 
                    color="inherit" 
                    aria-label="menu"
                    onClick={toggleMobileMenu}
                    sx={{ 
                      display: { xs: 'flex', md: 'none' },
                      color: 'text.primary'
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<HomeIcon />}
                      onClick={() => router.push('/')}
                      sx={{ 
                        borderRadius: '20px',
                        display: { xs: 'none', sm: 'flex' }
                      }}
                    >
                      
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{ 
                        borderRadius: '20px',
                        display: { xs: 'none', sm: 'flex' }
                      }}
                    >
                      
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Container>
          </Toolbar>
        </AppBar>
      </Slide>
      
      {/* เมนูมือถือ */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        sx={{
          '& .MuiDrawer-paper': { 
            width: '80%', 
            maxWidth: '300px',
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
            ระบบผู้ดูแล
          </Typography>
          <IconButton onClick={closeMobileMenu}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {adminMenuItems.map((item, index) => (
            <ListItem 
              key={index} 
              onClick={closeMobileMenu}
              sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
            >
              <Link href={item.href} style={{ display: 'flex', width: '100%', textDecoration: 'none', color: 'inherit' }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </Link>
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          <ListItem 
            onClick={closeMobileMenu}
            sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
          >
            <Link href="/" style={{ display: 'flex', width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="กลับหน้าร้าน" />
            </Link>
          </ListItem>
          <ListItem 
            onClick={handleLogout}
            sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }, cursor: 'pointer' }}
          >
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="ออกจากระบบ" />
          </ListItem>
        </List>
      </Drawer>
      
      {/* เนื้อหาหลัก */}
      <Box component="main" sx={{ 
        pt: { xs: 8, sm: 9 }, // ให้เนื้อหาอยู่ใต้ header
        minHeight: '100vh',
        bgcolor: '#f5f5f5'
      }}>
        {children}
      </Box>
    </>
  );
}
