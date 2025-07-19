"use client";

import { Inter, Prompt } from "next/font/google";
import { ReactNode, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ClientProvider from "../components/ClientProvider";
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
  styled
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import InfoIcon from '@mui/icons-material/Info';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import dynamic from "next/dynamic";
import CookieConsent from '@/components/CookieConsent';
import UserMenu from '@/components/UserMenu';
import { CartProvider, useCart } from '@/context/CartContext';
import CartButton from '@/components/CartButton';
import Cart from '@/components/Cart';
import LiffAutoLogin from '@/components/LiffAutoLogin';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const prompt = Prompt({ 
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt"
});

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

// ข้อมูลเมนู
const menuItems = [
  { text: 'หน้าแรก', href: '/', icon: <HomeIcon /> },
  { text: 'สินค้า', href: '/products', icon: <CategoryOutlinedIcon /> },
  { text: 'เกี่ยวกับเรา', href: '#about', icon: <InfoIcon /> },
  { text: 'ติดต่อเรา', href: '#contact', icon: <ContactSupportIcon /> }
];

// Import ClientOnly component แบบ dynamic เพื่อป้องกัน hydration error
const ClientOnly = dynamic(() => import("../components/ClientOnly"), { 
  ssr: false
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="emotion-insertion-point" content="" />
        <link rel="icon" href="/images/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/images/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </head>
      <body className={`${inter.variable} ${prompt.variable} font-sans`} suppressHydrationWarning>
        <CartProvider>
          <ClientOnly>
            <ClientProvider>
              <LiffAutoLogin liffId={process.env.NEXT_PUBLIC_LIFF_ID}>
                {children}
                <CookieConsent />
              </LiffAutoLogin>
            </ClientProvider>
          </ClientOnly>
        </CartProvider>
      </body>
    </html>
  );
}

// แยก RootLayoutContent เพื่อใช้ CartProvider ถูกต้อง
function RootLayoutContent({ children }: { children: React.ReactNode }) {
  // ย้าย CartProvider จากภายนอกมายังในคอมโพเนนต์นี้
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  // ใช้ useEffect เพื่อตรวจสอบว่าอยู่ฝั่ง client แล้ว
  useEffect(() => {
    setIsMounted(true);
    
    // ตรวจสอบขนาดหน้าจอเมื่ออยู่ฝั่ง client เท่านั้น
    if (typeof window !== 'undefined') {
      const checkIfDesktop = () => {
        setIsDesktop(window.innerWidth >= 960); // md breakpoint ของ MUI
      };
      
      checkIfDesktop();
      window.addEventListener('resize', checkIfDesktop);
      return () => window.removeEventListener('resize', checkIfDesktop);
    }
  }, []);
  
  // ฟังก์ชันเปิด/ปิดเมนูมือถือ
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // ฟังก์ชันปิดเมนูมือถือ
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // Scroll trigger สำหรับการซ่อน/แสดง AppBar เมื่อเลื่อนหน้าจอ
  const scrollTrigger = useScrollTrigger({
    threshold: 100,
    disableHysteresis: true
  });
  
  return (
    <>
      <ClientOnly>
        {isMounted && (
          <>
            <HeaderLayout 
              isDesktop={isDesktop} 
              toggleMobileMenu={toggleMobileMenu} 
              isMounted={isMounted}
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
                      onClick={closeMobileMenu}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: 'text.primary',
                        py: 1
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </Stack>
              </Box>
            </Drawer>
          </>
        )}
      </ClientOnly>
      
      {/* เนื้อหาหลัก */}
      <Box sx={{ pt: { xs: 7, sm: 8 }, minHeight: '100vh' }}>
        {children}
      </Box>
    </>
  );
}

// แยก HeaderLayout เพื่อความเป็นระเบียบของโค้ดและใช้ useCart ถูกต้อง
function HeaderLayout({ isDesktop, toggleMobileMenu, isMounted }: { 
  isDesktop: boolean; 
  toggleMobileMenu: () => void; 
  isMounted: boolean;
}) {
  // ใช้ useCart hook เพื่อเข้าถึงข้อมูลตะกร้าสินค้า
  const { getTotalItems, openCart: contextOpenCart, cartItems, updateQuantity, removeItem, isCartOpen, closeCart } = useCart();
  
  // ฟังก์ชันเปิดตะกร้าสินค้า
  const openCart = () => {
    contextOpenCart();
  };
  
  return (
    <>
      {/* ตะกร้าสินค้า */}
      <Cart
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClose={closeCart}
        isOpen={isCartOpen}
      />
      
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
                    <Image
                      src="/images/logo.webp"
                      alt="TreeTelu" 
                      width={150}
                      height={48}
                      style={{ objectFit: "contain" }}
                      priority
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {/* เมนูสำหรับจอใหญ่ */}
                  {isMounted && isDesktop && (
                    <Stack direction="row" spacing={4} sx={{ mr: 4 }}>
                      {menuItems.map((item, index) => (
                        <StyledNavButton 
                          key={index} 
                          href={item.href}
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <UserMenu />
                    <CartButton 
                      itemCount={getTotalItems()} 
                      onClick={openCart}
                      sx={{
                        color: 'text.primary',
                        '&:hover': {
                          color: 'primary.main',
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Container>
          </Toolbar>
        </AppBar>
      </Slide>
    </>
  );
}
