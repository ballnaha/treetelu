"use client";

import { ReactNode, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Cart from '@/components/Cart';
import CartButton from '@/components/CartButton';
import Footer from '@/components/Footer';
import UserMenu from '@/components/UserMenu';
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
  styled,
  useTheme,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import InfoIcon from '@mui/icons-material/Info';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import PaymentIcon from '@mui/icons-material/Payment';
import ArticleIcon from '@mui/icons-material/Article';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useRouter } from 'next/navigation';

// สร้าง styled component สำหรับ navigation
const StyledNavButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  padding: '6px 8px',
  borderRadius: '4px',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: '100%',
    height: 2,
    backgroundColor: theme.palette.primary.main,
    transition: 'right 0.3s ease',
  },
  '&:hover': {
    backgroundColor: 'transparent',
    '&::after': {
      right: 0,
    },
  },
  '&.active': {
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&::after': {
      right: 0,
    },
  }
}));

// ข้อมูลเมนู
const menuItems = [
  { text: 'หน้าแรก', href: '/', icon: <HomeIcon /> },
  { text: 'สินค้า', href: '/products', icon: <CategoryOutlinedIcon /> },
  { text: 'บทความ', href: '/blog', icon: <ArticleIcon /> },
  { text: 'แจ้งชำระเงิน', href: '/payment-confirmation', icon: <PaymentIcon /> },
  { text: 'ติดต่อเรา', href: '/contact', icon: <ContactSupportIcon /> },
];

export default function LayoutProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { cartItems, updateQuantity, removeItem, isCartOpen, closeCart, getTotalItems, openCart } = useCart();
  const router = useRouter();
  
  // สำหรับเมนูมือถือ
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // ใช้ useEffect เพื่อตรวจสอบว่าอยู่ฝั่ง client แล้ว
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // ใช้ state แทน useMediaQuery เพื่อแก้ปัญหา hydration
  const [isDesktop, setIsDesktop] = useState(true);
  
  useEffect(() => {
    // ตรวจสอบขนาดหน้าจอเมื่ออยู่ฝั่ง client เท่านั้น
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 960); // md breakpoint ของ MUI
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);
  
  // ฟังก์ชันตรวจสอบว่าเมนูกำลัง active หรือไม่
  const isMenuActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    // ตรวจสอบหากเป็นหน้าย่อยของ products เช่น /products/xxx
    if (href === '/products') {
      return pathname === '/products' || pathname?.startsWith('/products/');
    }
    // ตรวจสอบหากเป็นหน้าย่อยของ blog เช่น /blog/xxx
    if (href === '/blog') {
      return pathname === '/blog' || pathname?.startsWith('/blog/');
    }
    // ตรวจสอบหากเป็น anchor link
    if (href.startsWith('#')) {
      return pathname === '/' && typeof window !== 'undefined' && window.location.hash === href;
    }
    return pathname === href;
  };
  
  // ฟังก์ชันฟังก์ชันเปิด/ปิดเมนูมือถือ
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // ฟังก์ชันปิดเมนูมือถือ
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // ฟังก์ชันสำหรับการนำทางไปยังหน้าแรกโดยไม่ refresh page
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // ถ้าคลิกลิงก์ไปที่ anchor ภายในหน้าเดียวกัน ไม่ต้องทำอะไรให้ทำงานตามปกติ
    if (href.startsWith('#')) {
      return;
    }
    
    // ถ้าคลิกลิงก์ไปที่หน้าแรก ให้ป้องกันการ refresh page
    if (href === '/' && window.location.pathname === '/') {
      e.preventDefault();
      // ถ้าอยู่ที่หน้าแรกอยู่แล้ว อาจเลื่อนไปด้านบนของหน้า
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Scroll trigger สำหรับการซ่อน/แสดง AppBar เมื่อเลื่อนหน้าจอ
  const scrollTrigger = useScrollTrigger({
    threshold: 100,
    disableHysteresis: true
  });

  // เพิ่มปุ่มไอคอนบน navbar
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAccountMenuAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchorEl(null);
  };

  // เก็บข้อมูลผู้ใช้งาน
  const [user, setUser] = useState<{ name: string; isLoggedIn: boolean } | null>(null);
  
  // ดึงข้อมูลผู้ใช้งานจาก localStorage เมื่อ component ถูกโหลด
  useEffect(() => {
    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
    const getUserData = () => {
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user');
          //console.log('Raw user data:', userData); // Log เพื่อ debug
          if (userData) {
            const parsedUser = JSON.parse(userData);
            //console.log('Parsed user data:', parsedUser); // Log เพื่อ debug
            setUser(parsedUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
        }
      }
    }
    
    // เรียกใช้ฟังก์ชันเมื่อโหลดคอมโพเนนต์
    getUserData();
    
    // ตรวจจับการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        //console.log('User data changed in localStorage');
        getUserData();
      }
    };
    
    // ลงทะเบียน event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event สำหรับตรวจจับการเปลี่ยนแปลง login state
    const handleLoginStateChange = () => {
      //console.log('Login state change detected');
      getUserData();
    };
    
    window.addEventListener('loginStateChange', handleLoginStateChange);
    
    // ลบ event listener เมื่อ unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStateChange', handleLoginStateChange);
    };
  }, []);

  return (
    <>
      {isMounted && (
        <>
          <HeaderContent 
            isDesktop={isDesktop} 
            toggleMobileMenu={toggleMobileMenu} 
            isMounted={isMounted}
            handleNavigation={handleNavigation}
            isMenuActive={isMenuActive}
          />
          
          {/* ตะกร้าสินค้า */}
          <Cart
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClose={closeCart}
            isOpen={isCartOpen}
          />
          
          {/* เมนูมือถือแบบ Drawer */}
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={closeMobileMenu}
            PaperProps={{
              sx: {
                width: '80%',
                maxWidth: 300,
                backgroundColor: 'background.paper',
                boxShadow: 3,
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>เมนู</Typography>
              <IconButton onClick={closeMobileMenu}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {menuItems.map((item, index) => (
                  <Button
                    key={index}
                    startIcon={item.icon}
                    component={Link}
                    href={item.href}
                    onClick={(e) => {
                      closeMobileMenu();
                      handleNavigation(e, item.href);
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: isMenuActive(item.href) ? 'primary.main' : 'text.primary',
                      py: 1,
                      fontWeight: isMenuActive(item.href) ? 600 : 500,
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Drawer>
           
          {/* เพิ่มเมนู logout */}
          <UserMenu />
        </>
      )}
      
      {/* เนื้อหาหลัก */}
      <Box sx={{ pt: { xs: 7, sm: 8 }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
        {/* Footer */}
        <Footer />
      </Box>
    </>
  );
}

// แยก HeaderContent เพื่อความเป็นระเบียบของโค้ด
function HeaderContent({ 
  isDesktop, 
  toggleMobileMenu, 
  isMounted, 
  handleNavigation,
  isMenuActive
}: { 
  isDesktop: boolean; 
  toggleMobileMenu: () => void; 
  isMounted: boolean;
  handleNavigation: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  isMenuActive: (href: string) => boolean;
}) {
  const { getTotalItems, openCart: contextOpenCart } = useCart();
  const router = useRouter();
  
  // ฟังก์ชันเปิดตะกร้าสินค้า
  const openCart = () => {
    contextOpenCart();
  };
  
  return (
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
                  <Link href="/" onClick={(e) => handleNavigation(e, '/')}>
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
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* เมนูสำหรับจอใหญ่ */}
                {isMounted && isDesktop && (
                  <Stack direction="row" spacing={4} sx={{ mr: 4 }}>
                    {menuItems.map((item, index) => (
                      <Link 
                        key={index}
                        href={item.href}
                        onClick={(e) => handleNavigation(e, item.href)}
                        style={{ textDecoration: 'none' }}
                      >
                        <StyledNavButton 
                          className={isMenuActive(item.href) ? 'active' : ''}
                          sx={{ 
                            color: isMenuActive(item.href) ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {item.text}
                        </StyledNavButton>
                      </Link>
                    ))}
                  </Stack>
                )}
                
                {/* ปุ่มแฮมเบอร์เกอร์สำหรับเมนูมือถือ */}
                {isMounted && !isDesktop && (
                  <IconButton 
                    edge="start" 
                    color="inherit" 
                    aria-label="menu"
                    onClick={toggleMobileMenu}
                    sx={{ 
                      mr: 2,
                      color: 'text.primary'
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                
                {/* เมนูผู้ใช้ (เอามาจาก UserMenu) */}
                <UserMenu />
                
                {/* ปุ่มตะกร้า */}
                <CartButton 
                  itemCount={getTotalItems()} 
                  onClick={openCart}
                  sx={{
                    ml: 2,
                    color: 'text.primary',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                />
              </Box>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
    </Slide>
  );
} 