"use client";

import { useState, useEffect, ReactNode } from "react";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import CartButton from "@/components/CartButton";
import { useCart } from "@/context/CartContext";
import { formatProductData } from "../utils/imageUtils";
import CategorySwiper from "@/components/CategorySwiper";
import {
  AppBar,
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Toolbar,
  useMediaQuery,
  Stack,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Drawer,
  ListItemButton,
  Fade,
  Grid as MuiGrid,
  Snackbar,
  Alert,
  useScrollTrigger,
  Slide,
  Chip,
  SxProps,
  Theme,
  useTheme
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckIcon from "@mui/icons-material/Check";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import ClientSideWrapper from "@/components/ClientSideWrapper";
import dynamic from 'next/dynamic';
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import InfoIcon from "@mui/icons-material/Info";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Link from "next/link";

// สร้างคอมโพเนนต์สำหรับการแสดงผลเฉพาะฝั่งไคลเอนต์
const ClientOnlyContent = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), {
  ssr: false
});

// สร้าง styled components
const HeroSection = styled(Box)(({ theme }) => ({
  backgroundImage: "linear-gradient(to bottom, #ffffff, #f9fafb)",
  padding: 0,
  margin: 0,
  width: '100%',
  overflow: 'hidden',
  position: 'relative'
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: "relative",
  paddingBottom: theme.spacing(3),
  marginBottom: theme.spacing(2),
  textAlign: "center",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 48,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const SectionDescription = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  color: theme.palette.text.secondary,
  maxWidth: "800px",
  margin: "0 auto",
  marginBottom: theme.spacing(6),
  fontSize: "1.1rem",
  [theme.breakpoints.down('sm')]: {
    fontSize: "0.95rem"
  }
}));

const CategoryIconStyled = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: theme.palette.primary.main,
  margin: "0 auto",
  marginBottom: theme.spacing(2),
}));

const ProductSection = styled(Box)(({ theme }) => ({
  backgroundColor: "#f8f9fa",
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const FooterSection = styled(Box)(({ theme }) => ({
  backgroundColor: "#1D9679", // สีเขียวมิ้นท์เข้มสำหรับฟุตเตอร์
  color: '#fff',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const StyledNavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -4,
    left: 0,
    right: "100%",
    height: 2,
    backgroundColor: theme.palette.primary.main,
    transition: "right 0.3s ease",
  },
  "&:hover": {
    backgroundColor: "transparent",
    "&::after": {
      right: 0,
    },
  },
}));

const ArrowButton = styled(Button)(({ theme }) => ({
  "&:hover .arrow-icon": {
    transform: "translateX(5px)",
    transition: "transform 0.3s ease",
  },
}));

// ส่วนของหน้าโหลดเริ่มต้น (ใช้ HTML ธรรมดาแทน MUI components เพื่อหลีกเลี่ยง hydration error)
const LoadingScreen = () => (
  <div suppressHydrationWarning={true}
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}
  >
    <div style={{ position: 'relative', width: 60, height: 60, marginBottom: 16 }}>
      <div className="spinner-outer"></div>
      <div className="spinner-middle"></div>
      <div className="spinner-inner"></div>
    </div>
    
    <h2 
      style={{ 
        color: "#24B493",
        fontWeight: 500,
        fontSize: '1.25rem',
        fontFamily: '"Prompt", sans-serif',
        margin: 0
      }}
    >
      กำลังโหลด
    </h2>
    
    <style jsx>{`
      @keyframes spinner-outer {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes spinner-inner {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(-360deg); }
      }
      
      .spinner-outer {
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 4px solid transparent;
        border-top-color: #24B493;
        animation: spinner-outer 1.5s linear infinite;
      }
      
      .spinner-middle {
        position: absolute;
        width: 46px;
        height: 46px;
        top: 7px;
        left: 7px;
        border-radius: 50%;
        border: 4px solid transparent;
        border-top-color: #4CC9AD;
        animation: spinner-inner 1.2s linear infinite;
      }
      
      .spinner-inner {
        position: absolute;
        width: 30px;
        height: 30px;
        top: 15px;
        left: 15px;
        border-radius: 50%;
        border: 4px solid transparent;
        border-top-color: #8EACBC;
        animation: spinner-outer 0.9s linear infinite;
      }
    `}</style>
  </div>
);

// เพิ่มองค์ประกอบ Section สำหรับใช้ร่วมกัน
interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
  sx?: SxProps<Theme>;
}

const Section = ({ title, description, children, id, sx }: SectionProps) => {
    return (

        <Box id={id} sx={{ py: 10, backgroundColor: "white", ...(sx || {}) }}>
        <Container maxWidth="lg">
          <SectionTitle variant="h4">{title}</SectionTitle>
          {description && <SectionDescription variant="body2">{description}</SectionDescription>}
        </Container>
        {children}
      </Box>
    );
  };
  
  // เพิ่ม interface สำหรับ CategoryCard
  interface CategoryCardProps {
    title: string;
    description: string;
    bgImage: string;
    href?: string;
  }
  
  // ปรับรูปแบบการ์ดใหม่เป็นรูปด้านบน ข้อความด้านล่าง
  const CategoryCard = ({ title, description, bgImage, href = "#" }: CategoryCardProps) => {
    return (
      <Card 
        sx={{ 
          height: '100%', 
          overflow: 'hidden', 
          borderRadius: 2, 
          boxShadow: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 20px rgba(0,0,0,0.2)'
          }
        }}
      >
        {/* รูปภาพด้านบน */}
        <Box sx={{ position: "relative", width: "100%", pt: "60%" }}>
          <Image
            src={bgImage.replace("cover-tree.webp", "banner-3.png")}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            style={{ 
              objectFit: "cover",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px" 
            }}
          />
        </Box>
        
        {/* เนื้อหาข้อความด้านล่าง */}
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: { xs: "1rem", md: "1.25rem" }
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              flexGrow: 1
            }}
          >
            {description}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              borderColor: '#ffffff',
              borderWidth: 1,
              fontWeight: 600,
              px: 2,
              py: 0.75,
              borderRadius: '50px',
              textTransform: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              fontSize: { xs: '0.8rem', md: '0.85rem' },
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                borderColor: '#ffffff',
                transform: 'translateY(-2px)'
              }
            }}
          >
            ดูสินค้า
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  // แยกเนื้อหาหลักของเว็บไซต์เป็นคอมโพเนนต์แยกต่างหาก
  function MainContent({ 
    cartItems, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    isCartOpen, 
    openCart, 
    closeCart,
    categories,
    currentYear,
    showMenu,
    products,
    featuredBlogs = [],
    bestsellercategories = [] // เพิ่มพารามิเตอร์ bestsellercategories
  }: {
    cartItems: any[];
    updateQuantity: (id: string, quantity: number) => void;
    removeItem: (id: string) => void;
    getTotalItems: () => number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    categories: string[];
    currentYear: number;
    showMenu: boolean;
    products: any[];
    featuredBlogs?: any[];
    bestsellercategories?: any[]; // เพิ่มประเภทของ bestsellercategories
  }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // เพิ่ม state เพื่อควบคุมการแสดงผลหลังจาก hydration สมบูรณ์
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
      setIsMounted(true);
    }, []);
    
    // ข้อมูล slider
    const sliderItems = [
      {
        image: "/images/banner-3.png",
        title: "ให้ดอกไม้พูดแทนใจ...",
        subtitle: "ทุกความรู้สึกมีค่าเสมอ",
        description: "ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้จากเรา",
        href: "/products?category=bouquet"
      },
      {
        image: "/images/banner-4.png",
        title: "เริ่มต้นรักต้นไม้",
        subtitle: "เริ่มจากไม้อวบน้ำ",
        description: "ไม่ต้องมีเวลาดูแลมาก...ก็มีพื้นที่สีเขียวได้",
        href: "/products?category=succulent"
      }
    ];
    
    // ตั้งค่า auto slide เฉพาะบนอุปกรณ์ที่ไม่ใช่มือถือ
    useEffect(() => {
      // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
      const isMobileDevice = window.innerWidth < 600; // breakpoint สำหรับมือถือ
      
      // ตั้งค่า auto slide เฉพาะเมื่อไม่ใช่อุปกรณ์มือถือ
      if (!isMobileDevice) {
        const interval = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
        }, 10000);
        
        return () => clearInterval(interval);
      }
      // ไม่ต้องตั้งค่า interval สำหรับมือถือ เพราะต้องการให้เปลี่ยนรูปด้วยการ swipe เท่านั้น
    }, [sliderItems.length]);
    
    // ฟังก์ชันควบคุม slider
    const goToNextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    };
    
    const goToPrevSlide = () => {
      setCurrentSlide((prev) => (prev === 0 ? sliderItems.length - 1 : prev - 1));
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      if (touchStart - touchEnd > 75) {
        // สไลด์ไปทางซ้าย (ดูรูปถัดไป)
        goToNextSlide();
      }
      
      if (touchStart - touchEnd < -75) {
        // สไลด์ไปทางขวา (ดูรูปก่อนหน้า)
        goToPrevSlide();
      }
      
      // รีเซ็ตค่า
      setTouchStart(0);
      setTouchEnd(0);
    };
    
    // หากยังไม่ได้ mount ให้แสดง skeleton หรือไม่แสดงอะไร
    // ป้องกัน hydration error ที่เกิดจากการ render ในส่วนที่มี DOM ซับซ้อน
    if (!isMounted) {
      return (
        <Box sx={{ minHeight: "100vh" }} suppressHydrationWarning={true}>
          {/* Placeholder content */}
        </Box>
      );
    }
    
    return (
      <Box sx={{ minHeight: "100vh" }} suppressHydrationWarning={true}>
        {/* เนื้อหาหลัก */}
        <Box>
          {/* สไลด์เด่นหลักสุด */}
          <HeroSection sx={{ 
            position: 'relative',
            overflow: 'hidden',
            marginTop: -6
          }}>
            <Container maxWidth={false} disableGutters>
              <Box 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={{ 
                  position: 'relative',
                  width: '100%',
                  paddingTop: {
                    xs: 'calc(9 / 16 * 100%)', // สัดส่วน 16:9 สำหรับมือถือ
                    md: '30%', // ลดความสูงลงอีกสำหรับจอใหญ่
                    lg: '35%' // ลดความสูงลงอีกสำหรับจอใหญ่มาก
                  },
                  height: 'auto',
                  minHeight: { xs: '350px', sm: '380px', md: '450px', lg: '400px' }, // ลดความสูงลง
                  maxHeight: { xs: 'none', md: '500px', lg: '450px' }, // ลดความสูงลงอีก
                  overflow: 'hidden',
                  bgcolor: '#000'
                }}
              >
                {sliderItems.map((item, index) => (
                  <Fade 
                    key={index}
                    in={currentSlide === index} 
                    timeout={800}
                    style={{
                      display: currentSlide === index ? 'block' : 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 1,
                          background: {
                            xs: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
                            md: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
                          }
                        }}
                      />
                      <Image 
                        src={item.image}
                        alt={item.title}
                        fill
                        priority={true}
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                        }}
                        quality={90}
                      />
  
                      <Container 
                        maxWidth="lg"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: { xs: 'flex-end', md: 'center' },
                          pb: { xs: 8, md: 0 },
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <Box sx={{ 
                          maxWidth: { xs: '100%', md: '50%' }, 
                          animation: "fadeIn 0.8s ease forwards",
                          px: { xs: 2, sm: 0 }
                        }}>
                          <Typography 
                            variant="h1" 
                            sx={{ 
                              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", xl: "3rem" }, 
                              color: "white",
                              fontWeight: 500,
                              mb: { xs: 0.5, md: 1 },
                              lineHeight: "1.5",
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          >
                            {item.title}<br/>
                            <Box component="span" sx={{ color: "primary.light" }}>{item.subtitle}</Box>
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontSize: { xs: "0.9rem", sm: "1.1rem" }, 
                              color: "white", 
                              mb: { xs: 2, md: 4 }, 
                              maxWidth: "90%",
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              display: { xs: 'none', sm: 'block' },
                              
                            }}
                          >
                            {item.description}
                          </Typography>
                          <Stack 
                            direction="row"
                            spacing={{ xs: 1.5, sm: 2, md: 3 }}
                            sx={{ 
                              maxWidth: { xs: '100%', sm: 'auto' },
                              flexWrap: { xs: 'wrap', sm: 'nowrap' }
                            }}
                          >
                            

                            <Button 
                              variant="outlined" 
                              size="small" 
                              href={item.href}
                              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} className="arrow-icon" />}
                              // ป้องกันการ propagate ของ touch event ไปยัง parent
                              onTouchStart={(e) => {
                                // หยุดการ propagate ของ event ไปยัง parent
                                e.stopPropagation();
                              }}
                              onTouchMove={(e) => {
                                // หยุดการ propagate ของ event ไปยัง parent
                                e.stopPropagation();
                              }}
                              onTouchEnd={(e) => {
                                // หยุดการ propagate ของ event ไปยัง parent
                                e.stopPropagation();
                              }}
                              sx={{ 
                                color: 'white', 
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                borderColor: '#ffffff',
                                borderWidth: 1,
                                fontWeight: 600,
                                px: 2,
                                py: 0.75,
                                borderRadius: '50px',
                                textTransform: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease',
                                fontSize: { xs: '0.8rem', md: '0.85rem' },
                                minWidth: 'auto',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                                  borderColor: '#ffffff',
                                  transform: 'translateY(-2px)',
                                  '& .arrow-icon': {
                                    transform: 'translateX(3px)'
                                  }
                                }
                              }}
                            >
                              Shop Now
                            </Button>
                          </Stack>
                        </Box>
                      </Container>
                    </Box>
                  </Fade>
                ))}
                
                {/* ปุ่มควบคุม slider - แสดงเฉพาะบนอุปกรณ์ที่ไม่ใช่มือถือ */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: { xs: 15, md: 30 }, 
                  left: 0, 
                  right: 0, 
                  display: { xs: 'none', sm: 'flex' }, // ซ่อนบนมือถือ แสดงบนแท็บเล็ตขึ้นไป
                  justifyContent: 'center', 
                  zIndex: 10 
                }}>
                  {sliderItems.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      sx={{
                        width: { xs: 8, md: 12 },
                        height: { xs: 8, md: 12 },
                        borderRadius: '50%',
                        mx: { xs: 0.5, md: 1 },
                        bgcolor: currentSlide === index ? 'primary.main' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Box>
                
                {/* ตัวบอกตำแหน่งปัจจุบันสำหรับมือถือ - แสดงเฉพาะบนมือถือ */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 15, 
                  left: 0, 
                  right: 0, 
                  display: { xs: 'flex', sm: 'none' }, // แสดงเฉพาะบนมือถือ
                  justifyContent: 'center', 
                  zIndex: 10 
                }}>
                  {sliderItems.map((_, index) => (
                    <Box
                      key={index}
                      // ไม่มี onClick เพื่อให้เปลี่ยนรูปด้วยการ swipe เท่านั้นบนมือถือ
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        mx: 0.5,
                        bgcolor: currentSlide === index ? 'primary.main' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </Box>
                
                {/* ปุ่มเลื่อนซ้าย-ขวา */}
                <IconButton
                  onClick={goToPrevSlide}
                  sx={{
                    position: 'absolute',
                    left: { xs: 5, sm: 10, md: 40 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    width: { xs: 30, sm: 40, md: 48 },
                    height: { xs: 30, sm: 40, md: 48 },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    },
                    zIndex: 10,
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  <KeyboardArrowLeftIcon fontSize="medium" />
                </IconButton>
                <IconButton
                  onClick={goToNextSlide}
                  sx={{
                    position: 'absolute',
                    right: { xs: 5, sm: 10, md: 40 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    width: { xs: 30, sm: 40, md: 48 },
                    height: { xs: 30, sm: 40, md: 48 },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    },
                    zIndex: 10,
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  <KeyboardArrowRightIcon fontSize="medium" />
                </IconButton>
              </Box>
            </Container>
          </HeroSection>
  
        </Box>
        
        {/* หมวดหมู่สินค้า */}
        <Section
          id="categories"
          title="หมวดหมู่สินค้า"
          description="OUR COLLECTIONS"
        >
          {/* แสดงไอคอนสำหรับมือถือ */}
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mx: 'auto', display: { xs: 'block', sm: 'none' } }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2.5,
              mt: 2
            }}>
              {/* ไม้มงคล Icon */}
              <Box
                component={Link}
                href="/products?category=tree&sortBy=newest"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.5,
                  textDecoration: 'none',
                  borderRadius: 3,
                  aspectRatio: '1/1',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(29, 150, 121, 0.1)',
                  boxShadow: '0 4px 12px rgba(43, 78, 78, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: '#F0F7F4',
                    boxShadow: '0 8px 24px rgba(43, 78, 78, 0.12)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 150, 121, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: '#1D9679'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3.5C9.5 3.5 7.5 5.5 7.5 8C7.5 10.5 9.5 12.5 12 12.5C14.5 12.5 16.5 10.5 16.5 8C16.5 5.5 14.5 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 13.5C6 14.5 4.5 16.5 4.5 19H19.5C19.5 16.5 18 14.5 16 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14 7C14 7 13 8.2 12 8.2C11 8.2 10 7 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Box>
                <Typography variant="body2" color="text.primary" fontWeight={600} align="center">
                  ไม้มงคล
                </Typography>
              </Box>
              
              {/* ไม้อวบน้ำ Icon */}
              <Box
                component={Link}
                href="/products?category=succulent&sortBy=newest"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.5,
                  textDecoration: 'none',
                  borderRadius: 3,
                  aspectRatio: '1/1',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(29, 150, 121, 0.1)',
                  boxShadow: '0 4px 12px rgba(43, 78, 78, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: '#F0F7F4',
                    boxShadow: '0 8px 24px rgba(43, 78, 78, 0.12)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 150, 121, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: '#1D9679'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C12 22 20 18 20 12C20 6 16 4 12 4C8 4 4 6 4 12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 7C10 7 11 5.5 12 5.5C13 5.5 14 7 14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Box>
                <Typography variant="body2" color="text.primary" fontWeight={600} align="center">
                  ไม้อวบน้ำ
                </Typography>
              </Box>
              
              {/* ช่อดอกไม้ Icon */}
              <Box
                component={Link}
                href="/products?category=bouquet&sortBy=newest"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.5,
                  textDecoration: 'none',
                  borderRadius: 3,
                  aspectRatio: '1/1',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(29, 150, 121, 0.1)',
                  boxShadow: '0 4px 12px rgba(43, 78, 78, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: '#F0F7F4',
                    boxShadow: '0 8px 24px rgba(43, 78, 78, 0.12)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 150, 121, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: '#1D9679'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.5 9C15.5 6.5 14 4.5 12 4.5C10 4.5 8.5 6.5 8.5 9C8.5 11.5 10 13.5 12 13.5C14 13.5 15.5 11.5 15.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 9C8.5 6.5 7 4.5 5 4.5C3 4.5 1.5 6.5 1.5 9C1.5 11.5 3 13.5 5 13.5C7 13.5 8.5 11.5 8.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.5 9C15.5 6.5 17 4.5 19 4.5C21 4.5 22.5 6.5 22.5 9C22.5 11.5 21 13.5 19 13.5C17 13.5 15.5 11.5 15.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 13.5C5 15 8 16 12 16C16 16 19 15 19 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography variant="body2" color="text.primary" fontWeight={600} align="center">
                  ช่อดอกไม้
                </Typography>
              </Box>
              
              {/* ของชำร่วย Icon */}
              <Box
                component={Link}
                href="/products?category=souvenir&sortBy=newest"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.5,
                  textDecoration: 'none',
                  borderRadius: 3,
                  aspectRatio: '1/1',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(29, 150, 121, 0.1)',
                  boxShadow: '0 4px 12px rgba(43, 78, 78, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: '#F0F7F4',
                    boxShadow: '0 8px 24px rgba(43, 78, 78, 0.12)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 150, 121, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: '#1D9679'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 9L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 15L7 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 15L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography variant="body2" color="text.primary" fontWeight={600} align="center">
                  ของชำร่วย
                </Typography>
              </Box>
              
              {/* หรีดต้นไม้ Icon (เพิ่มใหม่) */}
              <Box
                component={Link}
                href="/products?category=wreath&sortBy=newest"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.5,
                  textDecoration: 'none',
                  borderRadius: 3,
                  aspectRatio: '1/1',
                  backgroundColor: '#F8F9FA',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(29, 150, 121, 0.1)',
                  boxShadow: '0 4px 12px rgba(43, 78, 78, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    backgroundColor: '#F0F7F4',
                    boxShadow: '0 8px 24px rgba(43, 78, 78, 0.12)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 150, 121, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: '#1D9679'
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography variant="body2" color="text.primary" fontWeight={600} align="center">
                  หรีดต้นไม้
                </Typography>
              </Box>
            </Box>
          </Container>
          
          {/* แสดงการ์ดสำหรับแท็บเล็ตและจอใหญ่ */}
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mx: 'auto', display: { xs: 'none', sm: 'block' }, mt: 4, mb: 3 }}>
            {/* หัวข้อหมวดหมู่ */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: 4
            }}>
              
            </Box>
            
            {/* Masonry Layout */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(10, 1fr)'
                },
                gridTemplateRows: 'masonry',
                gap: 2.5,
                gridAutoFlow: 'dense',
                '& > a:nth-of-type(1)': { 
                  gridColumn: { lg: 'span 4' },
                  gridRow: { lg: 'span 2' }
                },
                '& > a:nth-of-type(2)': { 
                  gridColumn: { lg: 'span 3' },
                  gridRow: { lg: 'span 1' }
                },
                '& > a:nth-of-type(3)': { 
                  gridColumn: { lg: 'span 3' },
                  gridRow: { lg: 'span 1' }
                },
                '& > a:nth-of-type(4)': { 
                  gridColumn: { lg: 'span 3' },
                  gridRow: { lg: 'span 1' }
                },
                '& > a:nth-of-type(5)': { 
                  gridColumn: { lg: 'span 3' },
                  gridRow: { lg: 'span 1' }
                }
              }}
            >
              {/* ไม้มงคล - การ์ดใหญ่ */}
              <Box
                component={Link}
                href="/products?category=tree&sortBy=newest"
                sx={{
                  position: 'relative',
                  height: { sm: 260, md: 320, lg: 440 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(245, 245, 245, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    '& .category-image': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Typography 
                    variant="h5" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    ไม้มงคล
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {products.filter(p => p.category === "tree" && p.productStatus === 'on').length} รายการ
                  </Typography>
                </Box>

                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Button
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      pl: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        pl: 0.5
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '35px',
                        height: '2px',
                        backgroundColor: 'text.primary',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '60px'
                      }
                    }}
                  >
                    ช้อปเลย
                  </Button>
                </Box>

                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '70%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image
                    src="/images/cover-tree.webp"
                    alt="ไม้มงคล"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center right',
                      transition: 'transform 0.6s ease'
                    }}
                    className="category-image"
                    priority
                  />
                </Box>
              </Box>
              
              {/* ไม้อวบน้ำ */}
              <Box
                component={Link}
                href="/products?category=succulent&sortBy=newest"
                sx={{
                  position: 'relative',
                  height: { sm: 260, md: 240, lg: 215 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(240, 247, 244, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    '& .category-image': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    ไม้อวบน้ำ
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {products.filter(p => p.category === "succulent" && p.productStatus === 'on').length} รายการ
                  </Typography>
                </Box>

                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Button
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      pl: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        pl: 0.5
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '35px',
                        height: '2px',
                        backgroundColor: 'text.primary',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '60px'
                      }
                    }}
                  >
                    ช้อปเลย
                  </Button>
                </Box>

                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image
                    src="/images/cover-succulent.webp"
                    alt="ไม้อวบน้ำ"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center right',
                      transition: 'transform 0.6s ease'
                    }}
                    className="category-image"
                  />
                </Box>
              </Box>
              
              {/* ช่อดอกไม้ */}
              <Box
                component={Link}
                href="/products?category=bouquet&sortBy=newest"
                sx={{
                  position: 'relative',
                  height: { sm: 260, md: 240, lg: 215 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(250, 245, 245, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    '& .category-image': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    ช่อดอกไม้
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {products.filter(p => p.category === "bouquet" && p.productStatus === 'on').length} รายการ
                  </Typography>
                </Box>

                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Button
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      pl: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        pl: 0.5
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '35px',
                        height: '2px',
                        backgroundColor: 'text.primary',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '60px'
                      }
                    }}
                  >
                    ช้อปเลย
                  </Button>
                </Box>

                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image
                    src="/images/cover-flower.webp"
                    alt="ช่อดอกไม้"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center right',
                      transition: 'transform 0.6s ease'
                    }}
                    className="category-image"
                  />
                </Box>
              </Box>
              
              {/* ของชำร่วย */}
              <Box
                component={Link}
                href="/products?category=souvenir&sortBy=newest"
                sx={{
                  position: 'relative',
                  height: { sm: 260, md: 240, lg: 215 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(242, 242, 247, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    '& .category-image': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    ของชำร่วย
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {products.filter(p => p.category === "souvenir" && p.productStatus === 'on').length} รายการ
                  </Typography>
                </Box>

                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Button
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      pl: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        pl: 0.5
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '35px',
                        height: '2px',
                        backgroundColor: 'text.primary',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '60px'
                      }
                    }}
                  >
                    ช้อปเลย
                  </Button>
                </Box>

                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image
                    src="/images/cover-gift.jpg"
                    alt="ของชำร่วย"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center right',
                      transition: 'transform 0.6s ease'
                    }}
                    className="category-image"
                  />
                </Box>
              </Box>
              
              {/* หรีดต้นไม้ */}
              <Box
                component={Link}
                href="/products?category=wreath&sortBy=newest"
                sx={{
                  position: 'relative',
                  height: { sm: 260, md: 240, lg: 215 },
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  textDecoration: 'none',
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(245, 247, 242, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    '& .category-image': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    หรีดต้นไม้
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {products.filter(p => p.category === "wreath" && p.productStatus === 'on').length} รายการ
                  </Typography>
                </Box>

                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  p: 3,
                  zIndex: 2 
                }}>
                  <Button
                    sx={{
                      color: 'text.primary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 1,
                      pl: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        pl: 0.5
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '35px',
                        height: '2px',
                        backgroundColor: 'text.primary',
                        transition: 'width 0.3s ease'
                      },
                      '&:hover::after': {
                        width: '60px'
                      }
                    }}
                  >
                    ช้อปเลย
                  </Button>
                </Box>

                <Box sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Image
                    src="/images/cover-wreath.webp"
                    alt="หรีดต้นไม้"
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center right',
                      transition: 'transform 0.6s ease'
                    }}
                    className="category-image"
                  />
                </Box>
              </Box>
            </Box>
          </Container>
        </Section>
  
          
          {/* ส่วนของ CategorySwiper */}
          {bestsellercategories.length > 0 ? (
            bestsellercategories.map((category) => (
              <CategorySwiper
                key={category.id}
                category={category.categoryName || 'tree'}
                title={category.categoryDesc || 'ต้นไม้มงคล'}
              />
            ))
          ) : (
            // แสดง CategorySwiper แบบเดิมถ้าไม่มีข้อมูล bestseller categories
            <>
              <CategorySwiper 
                category="tree" 
                title="ต้นไม้มงคล" 
              />
              
              <CategorySwiper 
                category="succulent" 
                title="ไม้อวบน้ำ" 
              />
    
              <CategorySwiper 
                category="souvenir" 
                title="ของชำร่วย" 
              />
            </>
          )}
  
        <Section
          id="products"
          title="สินค้าแนะนำ"
          description="เรารวบรวมต้นไม้ ไม้อวบน้ำ พวงหรีดต้นไม้ ช่อดอกไม้ ของชำร่วย สำหรับทุกโอกาสพิเศษ"
        >
          <Container maxWidth={false} sx={{ 
            px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
            maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1400px' }, 
            mx: 'auto',
            overflow: 'hidden' 
          }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", mx: -2 }}>
              {products.slice(0, 12).map((product) => (
                <Box key={product.id} sx={{ width: { xs: "50%", sm: "50%", lg: "25%" }, p: 1 }}>
                  <ProductCard 
                    product={product}
                  />
                </Box>
              ))}
            </Box>
            
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <Link href="/products" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="outlined"
                color="primary"
                  size="large"
                  endIcon={<ArrowForwardIcon className="arrow-icon" sx={{ transition: 'transform 0.3s' }} />}
                  sx={{ 
                    borderRadius: '50px', 
                    px: 4,
                    py: 1.2,
                    fontWeight: 600,
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    borderColor: '#1D9679',
                    color: '#1D9679',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#1D9679',
                      backgroundColor: 'rgba(29, 150, 121, 0.05)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(29, 150, 121, 0.15)',
                      '& .arrow-icon': {
                        transform: 'translateX(5px)'
                      }
                    }
                  }}
              >
                ดูสินค้าทั้งหมด
                </Button>
              </Link>
            </Box>
          </Container>
        </Section>
  
        <Section
          id="services"
          title="คลังความรู้สายมูเตลู"
          description="เรารวบรวมข้อมูลความเชื่อ โชคลาง และพลังงานที่เกี่ยวกับต้นไม้ต่างๆ ให้คุณได้เลือกต้นไม้ที่ตรงกับความต้องการในการเสริมดวง"
          sx={{ 
            backgroundColor: '#f2f8f5', 
            backgroundImage: 'linear-gradient(to bottom, #f2f8f5, #e8f5f0)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundRepeat: 'repeat',
              opacity: 0.05,
              zIndex: 0
            }
          }}
        >
          <Container maxWidth={false} sx={{ 
            px: { xs: 2, sm: 3 }, 
            maxWidth: { md: '1200px' }, 
            mx: 'auto',
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: { 
                xs: "1fr", 
                sm: "repeat(2, 1fr)", 
                md: "repeat(3, 1fr)" 
              },
              gap: 3,
              mt: 2
            }}>
              {featuredBlogs.length > 0 ? (
                // แสดงบทความจาก API แบบ minimal design
                featuredBlogs.map((blog) => (
                  <Box
                    key={blog.id}
                    component={Link}
                    href={`/blog/${blog.slug || blog.id}`}
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(0,0,0,0.04)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.09)',
                        '& .blog-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', overflow: 'hidden' }}>
                      <Image
                        src={blog.image || '/images/blog/placeholder.jpg'}
                        alt={blog.title}
                        fill
                        className="blog-image"
                        style={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
                        }}
                      />
                      {blog.category && (
                        <Chip 
                          label={blog.category} 
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: 16, 
                            left: 16, 
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                            letterSpacing: '0.5px',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            '& .MuiChip-label': { 
                              px: 1.2
                            }
                          }} 
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ 
                      p: 2.5, 
                      display: 'flex', 
                      flexDirection: 'column',
                      flexGrow: 1,
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                            fontWeight: 600,
                            mb: 1,
                            color: 'text.primary',
                            lineHeight: 1.4,
                            minHeight: { xs: '2.8rem', sm: '3.2rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {blog.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                            opacity: 0.85
                          }}
                        >
                          {blog.excerpt || blog.content?.substring(0, 100) + '...'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid rgba(0,0,0,0.04)'
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : ''}
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'primary.main',
                          fontWeight: 500,
                          fontSize: '0.8rem'
                        }}>
                          <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 500 }}>
                            อ่านต่อ
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} className="arrow-icon" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                // Fallback content รูปแบบ minimal เมื่อไม่มีข้อมูลบทความ
                <>
                  {/* Knowledge Box 1 */}
                  <Box
                    component={Link}
                    href="/blog"
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(0,0,0,0.04)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.09)',
                        '& .blog-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', overflow: 'hidden' }}>
                      <Image
                        src="/images/blog/north.jpg"
                        alt="ไม้มงคล"
                        fill
                        className="blog-image"
                        style={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
                        }}
                      />
                      <Chip 
                        label="ฮวงจุ้ย" 
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          left: 16, 
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          letterSpacing: '0.5px',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '& .MuiChip-label': { 
                            px: 1.2
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ 
                      p: 2.5, 
                      display: 'flex', 
                      flexDirection: 'column',
                      flexGrow: 1,
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                            fontWeight: 600,
                            mb: 1,
                            color: 'text.primary',
                            lineHeight: 1.4,
                            minHeight: { xs: '2.8rem', sm: '3.2rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          ต้นไม้ฮวงจุ้ยที่ควรปลูกตามทิศต่างๆ
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                            opacity: 0.85
                          }}
                        >
                          การเลือกปลูกต้นไม้ให้ถูกทิศตามหลักฮวงจุ้ย จะช่วยเสริมพลังงานที่ดีและดึงดูดโชคลาภเข้าสู่บ้านของคุณ
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid rgba(0,0,0,0.04)'
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'primary.main',
                          fontWeight: 500,
                          fontSize: '0.8rem'
                        }}>
                          <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 500 }}>
                            อ่านต่อ
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} className="arrow-icon" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Knowledge Box 2 */}
                  <Box
                    component={Link}
                    href="/blog/5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน"
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(0,0,0,0.04)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.09)',
                        '& .blog-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', overflow: 'hidden' }}>
                      <Image
                        src="/images/blog/money-tree.jpg"
                        alt="ไม้มงคล"
                        fill
                        className="blog-image"
                        style={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
                        }}
                      />
                      <Chip 
                        label="ไม้มงคล" 
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          left: 16, 
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          letterSpacing: '0.5px',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '& .MuiChip-label': { 
                            px: 1.2
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ 
                      p: 2.5, 
                      display: 'flex', 
                      flexDirection: 'column',
                      flexGrow: 1,
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                            fontWeight: 600,
                            mb: 1,
                            color: 'text.primary',
                            lineHeight: 1.4,
                            minHeight: { xs: '2.8rem', sm: '3.2rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                            opacity: 0.85
                          }}
                        >
                          ต้นไม้มงคลบางชนิดมีความเชื่อว่าช่วยดึงดูดเงินทอง เสริมโชคลาภและความมั่งคั่งให้กับผู้ครอบครอง
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid rgba(0,0,0,0.04)'
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'primary.main',
                          fontWeight: 500,
                          fontSize: '0.8rem'
                        }}>
                          <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 500 }}>
                            อ่านต่อ
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} className="arrow-icon" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Knowledge Box 3 */}
                  <Box
                    component={Link}
                    href="/blog/ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง"
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(0,0,0,0.04)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.09)',
                        '& .blog-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '56.25%', overflow: 'hidden' }}>
                      <Image
                        src="/images/blog/negative-energy.jpg"
                        alt="ต้นไม้ดูดพลังงาน"
                        fill
                        className="blog-image"
                        style={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
                        }}
                      />
                      <Chip 
                        label="พลังงาน" 
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          left: 16, 
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          fontSize: '0.65rem',
                          letterSpacing: '0.5px',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '& .MuiChip-label': { 
                            px: 1.2
                          }
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ 
                      p: 2.5, 
                      display: 'flex', 
                      flexDirection: 'column',
                      flexGrow: 1,
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                            fontWeight: 600,
                            mb: 1,
                            color: 'text.primary',
                            lineHeight: 1.4,
                            minHeight: { xs: '2.8rem', sm: '3.2rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary', 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                            opacity: 0.85
                          }}
                        >
                          ต้นไม้บางชนิดมีคุณสมบัติในการดูดซับพลังงานลบ ช่วยสร้างบรรยากาศที่สงบและเป็นมงคลให้กับบ้านของคุณ
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 'auto',
                        pt: 1.5,
                        borderTop: '1px solid rgba(0,0,0,0.04)'
                      }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'primary.main',
                          fontWeight: 500,
                          fontSize: '0.8rem'
                        }}>
                          <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 500 }}>
                            อ่านต่อ
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} className="arrow-icon" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button 
                component={Link}
                href="/blog"
                variant="outlined" 
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon className="arrow-icon" sx={{ transition: 'transform 0.3s' }} />}
                sx={{ 
                  borderRadius: '50px', 
                  px: 4,
                  py: 1.2,
                  fontWeight: 600,
                  borderWidth: 2,
                  backgroundColor: 'transparent',
                  borderColor: '#1D9679',
                  color: '#1D9679',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#1D9679',
                    backgroundColor: 'rgba(29, 150, 121, 0.05)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 12px rgba(29, 150, 121, 0.15)',
                    '& .arrow-icon': {
                      transform: 'translateX(5px)'
                    }
                  }
                }}
              >
                ดูบทความสายมูทั้งหมด
              </Button>
            </Box>
          </Container>
        </Section>
  
        <FooterSection>
          <Container maxWidth="lg">
            <Stack direction={{ xs: "column", md: "row" }} spacing={6}>
              <Box sx={{ width: { xs: "100%", md: "33.33%" } }}>
                <Box sx={{ position: "relative", width: 180, height: 60, mb: 3 }}>
                  <Image
                    src="/logo-white.png" 
                    alt="TreeTelu" 
                    width={180}
                    height={60}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 4, maxWidth: 350 }}>
                
                เราเป็นร้านต้นไม้ออนไลน์ที่รวบรวม ต้นไม้มงคล เพิ่มโชคลาภ, ไม้อวบน้ำ สุดน่ารักดูแลง่าย, ไม้ฟอกอากาศ เพื่อสุขภาพที่ดี, ช่อดอกไม้จัดสวย สำหรับทุกโอกาส และ หรีดต้นไม้ ที่ให้ทั้งความอาลัยและการเติบโตต่อไปอย่างยั่งยืน — ทุกต้น ทุกช่อ เราคัดสรรด้วยความใส่ใจ เพื่อส่งมอบความงามและความหมายถึงมือคุณ
                </Typography>
                <Stack direction="row" spacing={2}>
                  <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }} href="https://facebook.com/treetelu191" target="_blank" rel="noopener noreferrer" >
                    <FacebookIcon />
                  </IconButton>
                  <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    <TwitterIcon />
                  </IconButton>
                  <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    <InstagramIcon />
                  </IconButton>
                  <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    <YouTubeIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "50%", md: "33.33%" } }}>
                <Typography variant="h6" sx={{ mb: 3 }}>ข้อมูลติดต่อ</Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
  
                  <br />Line id: @095xrokt
                </Typography>
                <Typography variant="body2">
                  เวลาทำการ: ทุกวัน 9:00 - 20:00 น.
                </Typography>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "50%", md: "33.33%" } }}>
                <Typography variant="h6" sx={{ mb: 3, color: "white" }}>ลิงก์ด่วน</Typography>
                <Stack spacing={2}>
                  <Box component={Link} 
                    href="/products" 
                    sx={{ 
                      color: "white !important",
                      textDecoration: "none !important",
                      display: "block",
                      fontSize: "0.95rem", 
                      transition: "all 0.3s ease",
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1,
                        paddingLeft: "8px",
                        borderLeft: "2px solid white"
                      }
                    }}
                  >
                    สินค้าทั้งหมด
                  </Box>
                  <Box component={Link} 
                    href="/payment-confirmation" 
                    sx={{ 
                      color: "white !important",
                      textDecoration: "none !important",
                      display: "block",
                      fontSize: "0.95rem", 
                      transition: "all 0.3s ease",
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1,
                        paddingLeft: "8px",
                        borderLeft: "2px solid white"
                      }
                    }}
                  >
                    แจ้งชำระเงิน
                  </Box>
                  
                  <Box component={Link} 
                    href="/privacy-policy" 
                    sx={{ 
                      color: "white !important",
                      textDecoration: "none !important",
                      display: "block",
                      fontSize: "0.95rem", 
                      transition: "all 0.3s ease",
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1,
                        paddingLeft: "8px",
                        borderLeft: "2px solid white"
                      }
                    }}
                  >
                    นโยบายความเป็นส่วนตัว
                  </Box>
                  <Box component={Link} 
                    href="/terms-of-service" 
                    sx={{ 
                      color: "white !important",
                      textDecoration: "none !important",
                      display: "block",
                      fontSize: "0.95rem", 
                      transition: "all 0.3s ease",
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1,
                        paddingLeft: "8px",
                        borderLeft: "2px solid white"
                      }
                    }}
                  >
                    เงื่อนไขการใช้บริการ
                  </Box>
                </Stack>
              </Box>
            </Stack>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 4 }} />
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              © {currentYear} TreeTelu. สงวนลิขสิทธิ์ทั้งหมด.
            </Typography>
          </Container>
        </FooterSection>
        
        <Cart 
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClose={closeCart}
          isOpen={isCartOpen}
        />
      </Box>
    );
  }
  
  // แยก component สำหรับการทำงานฝั่ง client
  function ClientSideHome({ products: initialProducts, categories: initialCategories }: { products?: any[], categories?: any[] } = {}) {
    // ใช้ theme จาก ThemeProvider จากไฟล์ ClientProvider
    const theme = useTheme();
    const { getTotalItems, openCart, closeCart, cartItems, updateQuantity, removeItem, isCartOpen } = useCart();
    const [products, setProducts] = useState(initialProducts || []);
    const [categories, setCategories] = useState(initialCategories || []);
    const [bestsellercategories, setBestsellerCategories] = useState<any[]>([]); // เพิ่ม state สำหรับเก็บหมวดหมู่ bestseller
    const [featuredBlogs, setFeaturedBlogs] = useState<any[]>([]); // เพิ่ม state สำหรับเก็บบทความ
    const [loading, setLoading] = useState(!initialProducts);
    const [error, setError] = useState<string | null>(null);
    const [currentYear] = useState(() => new Date().getFullYear());
    const [isMobile, setIsMobile] = useState(false);
    
    // สร้างรายชื่อหมวดหมู่
    const categoryNames: string[] = categories ? Array.from(new Set(categories.map((cat: any) => cat.name))) : [];
    
    // เรียกใช้ useState ในส่วนต้นของฟังก์ชัน
    const [isClient, setIsClient] = useState(false);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ดึงข้อมูลสินค้าจาก API
        const productsRes = await fetch('/api/products');
        if (!productsRes.ok) {
          throw new Error(`Error loading products: ${productsRes.status}`);
        }
        const productsData = await productsRes.json();
        // ปรับให้รองรับโครงสร้างข้อมูลใหม่ - ข้อมูลอยู่ใน property 'products'
        const productArray = productsData.products || [];
        const formattedProducts = productArray.map(formatProductData);
        setProducts(formattedProducts);
        
        // ดึงข้อมูลหมวดหมู่จาก API
        const categoriesRes = await fetch('/api/categories');
        if (!categoriesRes.ok) {
          throw new Error(`Error loading categories: ${categoriesRes.status}`);
        }
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        // ดึงข้อมูลหมวดหมู่ bestseller จาก API
        const bestsellerRes = await fetch('/api/categories?bestseller=on');
        if (bestsellerRes.ok) {
          const bestsellerData = await bestsellerRes.json();
          setBestsellerCategories(bestsellerData);
        } else {
          console.error('Error loading bestseller categories:', bestsellerRes.status);
        }
        
        // ดึงข้อมูลบทความเด่นจาก API
        const blogsRes = await fetch('/api/featured-blogs');
        if (blogsRes.ok) {
          const blogsData = await blogsRes.json();
          setFeaturedBlogs(blogsData.blogs || []);
        } else {
          console.error('Error loading featured blogs:', blogsRes.status);
        }
        
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setLoading(false);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };
    
    useEffect(() => {
      // ดึงข้อมูลเมื่อไม่มีข้อมูลเริ่มต้น
      if (!initialProducts || !initialCategories) {
        fetchData();
      }
    }, [initialProducts, initialCategories]);
    
    useEffect(() => {
      setIsClient(true);
      
      const handleResize = () => {
        setIsMobile(window.innerWidth < 960);
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
    
    // แสดงหน้า error หากมีข้อผิดพลาด
    if (error) {
      return (
        <div suppressHydrationWarning={true} style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center', 
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: "#d32f2f", marginBottom: '16px' }}>ไม่สามารถโหลดข้อมูลได้</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#1D9679',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      );
    }
    
    // แสดงหน้า loading หากกำลังโหลดข้อมูล
    if (loading || !isClient) {
      return <LoadingScreen />;
    }
  
    return (
      <Box suppressHydrationWarning={true} component="div" sx={{ width: '100%' }}>
        <MainContent 
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
          getTotalItems={getTotalItems}
          isCartOpen={isCartOpen}
          openCart={openCart}
          closeCart={closeCart}
          categories={categoryNames}
          currentYear={currentYear}
          showMenu={!isMobile}
          products={products}
          featuredBlogs={featuredBlogs}
          bestsellercategories={bestsellercategories} // ส่ง bestsellercategories ไปยัง MainContent
        />
      </Box>
    );
  }
  
  export default function Home() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    
    const goToNextSlide = () => {
      // ไม่ได้ใช้งานจริงเนื่องจากเป็นฟังก์ชันใน ClientSideHome
      console.log('Next slide');
    };
    
    const goToPrevSlide = () => {
      // ไม่ได้ใช้งานจริงเนื่องจากเป็นฟังก์ชันใน ClientSideHome
      console.log('Previous slide');
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };
    
    const handleTouchEnd = () => {
      if (touchStart - touchEnd > 75) {
        // สไลด์ไปทางซ้าย (ดูรูปถัดไป)
        goToNextSlide();
      }
      
      if (touchStart - touchEnd < -75) {
        // สไลด์ไปทางขวา (ดูรูปก่อนหน้า)
        goToPrevSlide();
      }
      
      // รีเซ็ตค่า
      setTouchStart(0);
      setTouchEnd(0);
    };
  
    return (
      <ClientSideHome />
    );
}