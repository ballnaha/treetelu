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
  products
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
      description: "ส่งต่อความรัก…ในทุกช่วงเวลา ด้วยช่อดอกไม้จากเรา"
    },
    {
      image: "/images/banner-4.png",
      title: "เริ่มต้นรักต้นไม้",
      subtitle: "เริ่มจากไม้อวบน้ำ",
      description: "ไม่ต้องมีเวลาดูแลมาก...ก็มีพื้นที่สีเขียวได้"
    }
  ];
  
  // ตั้งค่า auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 10000);
    
    return () => clearInterval(interval);
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
        <HeroSection>
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
                        zIndex: 2
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
                            href="#services"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} className="arrow-icon" />}
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
              
              {/* ปุ่มควบคุม slider */}
              <Box sx={{ position: 'absolute', bottom: { xs: 15, md: 30 }, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
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
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mx: 'auto' }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)' 
            },
            gap: 3
          }}>
            {/* Tree Card */}
            <Card 
              component={Link}
              href="/products?category=tree&sortBy=newest"
              sx={{
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                overflow: 'hidden', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0px 7px 30px rgba(43, 78, 78, 0.1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-16px)',
                  boxShadow: '0px 16px 70px rgba(43, 78, 78, 0.2)',
                  '& .category-media': {
                    transform: 'scale(1.1)'
                  },
                  '& .category-overlay': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '80%', overflow: 'hidden' }}>
                <Box 
                  className="category-overlay"
                    sx={{ 
                      position: 'absolute', 
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    zIndex: 1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <Image
                  className="category-media"
                  src="/images/cover-tree.webp"
                  alt="ไม้มงคล"
                  fill
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  priority
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white' 
              }}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    ไม้มงคล
                    </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 35, height: 35 }}>
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    opacity: 0.85
                  }}
                >
                  ต้นไม้ที่นำโชคและสร้างบรรยากาศที่ดีให้กับบ้านของคุณ
                    </Typography>
                <Chip 
                  label={`ดูสินค้า `} 
                      size="small" 
                      sx={{ 
                    alignSelf: 'flex-start', 
                    bgcolor: 'primary.light', 
                        color: 'white', 
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />

              </CardContent>
              </Card>

            {/* Succulents Card */}
            <Card 
              component={Link}
              href="/products?category=succulent&sortBy=newest"
              sx={{
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                overflow: 'hidden', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0px 7px 30px rgba(43, 78, 78, 0.1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-16px)',
                  boxShadow: '0px 16px 70px rgba(43, 78, 78, 0.2)',
                  '& .category-media': {
                    transform: 'scale(1.1)'
                  },
                  '& .category-overlay': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '80%', overflow: 'hidden' }}>
                <Box 
                  className="category-overlay"
                    sx={{ 
                      position: 'absolute', 
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    zIndex: 1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <Image
                  className="category-media"
                  src="/images/cover-succulent.webp"
                  alt="ไม้อวบน้ำ"
                  fill
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  priority
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white' 
              }}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    ไม้อวบน้ำ
                    </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 35, height: 35 }}>
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    opacity: 0.85
                  }}
                >
                  ไม้ที่เลี้ยงง่าย ทนแล้ง เหมาะสำหรับผู้เริ่มต้น
                    </Typography>
                <Chip 
                  label={`ดูสินค้า`}
                      size="small" 
                      sx={{ 
                    alignSelf: 'flex-start', 
                    bgcolor: 'primary.light', 
                        color: 'white', 
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />
              </CardContent>
              </Card>

            {/* Flower Bouquets Card */}
            <Card 
              component={Link}
              href="/products?category=bouquet&sortBy=newest"
              sx={{
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                overflow: 'hidden', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0px 7px 30px rgba(43, 78, 78, 0.1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-16px)',
                  boxShadow: '0px 16px 70px rgba(43, 78, 78, 0.2)',
                  '& .category-media': {
                    transform: 'scale(1.1)'
                  },
                  '& .category-overlay': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '80%', overflow: 'hidden' }}>
                <Box 
                  className="category-overlay"
                    sx={{ 
                      position: 'absolute', 
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    zIndex: 1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <Image
                  className="category-media"
                  src="/images/cover-flower.webp"
                  alt="ช่อดอกไม้"
                  fill
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  priority
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white' 
              }}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                      ช่อดอกไม้
                    </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 35, height: 35 }}>
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    opacity: 0.85
                  }}
                >
                  ช่อดอกไม้สดคัดพิเศษ สำหรับทุกโอกาสพิเศษ
                    </Typography>
                <Chip 
                  label={`ดูสินค้า`}   
                      size="small" 
                      sx={{ 
                    alignSelf: 'flex-start', 
                    bgcolor: 'primary.light', 
                        color: 'white', 
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />
              </CardContent>
              </Card>

            {/* Plant Souvenir Card */}
            <Card 
              component={Link}
              href="/products?category=souvenir&sortBy=newest"
              sx={{
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                backgroundColor: '#FFFFFF',
                borderRadius: 4,
                overflow: 'hidden', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0px 7px 30px rgba(43, 78, 78, 0.1)',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-16px)',
                  boxShadow: '0px 16px 70px rgba(43, 78, 78, 0.2)',
                  '& .category-media': {
                    transform: 'scale(1.1)'
                  },
                  '& .category-overlay': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '80%', overflow: 'hidden' }}>
                <Box 
                  className="category-overlay"
                    sx={{ 
                      position: 'absolute', 
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    zIndex: 1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <Image
                  className="category-media"
                  src="/images/cover-gift.jpg"
                  alt="ของชำร่วยต้นไม้"
                  fill
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  priority
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white' 
              }}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                      ของชำร่วยต้นไม้
                    </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 35, height: 35 }}>
                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    opacity: 0.85
                  }}
                >
                  ของชำร่วยต้นไม้สำหรับทุกโอกาส
                    </Typography>
                <Chip 
                  label={`ดูสินค้า`} 
                      size="small" 
                      sx={{ 
                    alignSelf: 'flex-start', 
                    bgcolor: 'primary.light', 
                        color: 'white', 
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />
              </CardContent>
              </Card>
          </Box>
        </Container>
      </Section>

        
        {/* เพิ่ม Category Swiper สำหรับต้นไม้ */}
        <CategorySwiper 
          category="tree" 
          title="ต้นไม้มงคล" 
          
        />
        
        {/* เพิ่ม Category Swiper สำหรับไม้อวบน้ำ */}
        <CategorySwiper 
          category="succulent" 
          title="ไม้อวบน้ำ" 
           
        />

        {/* เพิ่ม Category Swiper สำหรับของชำร่วยต้นไม้ */}
        <CategorySwiper 
          category="souvenir" 
          title="ของชำร่วย" 
           
        />

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
              <Box key={product.id} sx={{ width: { xs: "50%", sm: "50%", lg: "25%" }, p: 2 }}>
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
            backgroundImage: 'url(/images/pattern-leaf.png)',
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
            {/* Knowledge Box 1 */}
            <Paper 
              elevation={0} 
                sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                height: '100%',
                border: '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
                <Image
                  src="/images/blog/north.jpg"
                  alt="ไม้มงคล"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <Box sx={{ 
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'primary.main',
                  color: 'white',
                  py: 0.6,
                  px: 2,
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  zIndex: 10
                }}>
                  ฮวงจุ้ย
                </Box>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                  ต้นไม้ฮวงจุ้ยที่ควรปลูกตามทิศต่างๆ
              </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  การเลือกปลูกต้นไม้ให้ถูกทิศตามหลักฮวงจุ้ย จะช่วยเสริมพลังงานที่ดีและดึงดูดโชคลาภเข้าสู่บ้านของคุณ
              </Typography>
                <Button 
                variant="text"
                  color="primary"
                  href="/blog"
                  endIcon={<ArrowForwardIcon className="arrow-icon" sx={{ transition: 'transform 0.3s' }} />}
                  sx={{ 
                    fontWeight: 500,
                    '&:hover .arrow-icon': {
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  อ่านเพิ่มเติม
                </Button>
            </Box>
            </Paper>

            {/* Knowledge Box 2 */}
              <Paper 
              elevation={0} 
                sx={{ 
                  borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                height: '100%',
                border: '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
                  <Image
                  src="/images/blog/money-tree.jpg"
                  alt="ไม้มงคล"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <Box sx={{ 
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'primary.main',
                  color: 'white',
                  py: 0.6,
                  px: 2,
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  zIndex: 10
                }}>
                  ไม้มงคล
                </Box>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                  5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ต้นไม้มงคลบางชนิดมีความเชื่อว่าช่วยดึงดูดเงินทอง เสริมโชคลาภและความมั่งคั่งให้กับผู้ครอบครอง
                </Typography>
                <Button 
                  variant="text" 
                  color="primary"
                  href="/blog/5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน"
                  endIcon={<ArrowForwardIcon className="arrow-icon" sx={{ transition: 'transform 0.3s' }} />}
                    sx={{ 
                    fontWeight: 500,
                    '&:hover .arrow-icon': {
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  อ่านเพิ่มเติม
                </Button>
                    </Box>
                  </Paper>

            {/* Knowledge Box 3 */}
                  <Paper 
              elevation={0} 
                    sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                height: '100%',
                border: '1px solid rgba(0,0,0,0.03)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
                      <Image
                  src="/images/blog/negative-energy.jpg"
                  alt="ต้นไม้ดูดพลังงาน"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <Box sx={{ 
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'primary.main',
                  color: 'white',
                  py: 0.6,
                  px: 2,
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  zIndex: 10
                }}>
                  พลังงาน
                    </Box>
                </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                  ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ต้นไม้บางชนิดมีคุณสมบัติในการดูดซับพลังงานลบ ช่วยสร้างบรรยากาศที่สงบและเป็นมงคลให้กับบ้านของคุณ
                </Typography>
                <Button 
                  variant="text" 
                  color="primary"
                  href="/blog/ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง"
                  endIcon={<ArrowForwardIcon className="arrow-icon" sx={{ transition: 'transform 0.3s' }} />}
                    sx={{ 
                    fontWeight: 500,
                    '&:hover .arrow-icon': {
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  อ่านเพิ่มเติม
                </Button>
                    </Box>
                  </Paper>
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
                <IconButton sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
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
