"use client";

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  Breadcrumbs,
  Avatar
} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

export default function ContactPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by ensuring client-side rendering is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the full content after client-side hydration is complete
  if (!mounted) {
    return (
      <Box component="main" sx={{ 
        pt: { xs: 10, md: 12 }, 
        pb: { xs: 8, md: 10 },
        bgcolor: '#f8faf8',
        minHeight: '100vh'
      }}>
        {/* Simple loading state */}
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Typography variant="h5" sx={{ color: '#2e5d4b' }}>กำลังโหลด...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box 
    sx={{ 
      flex: 1,
      py: { xs: 0 },
      backgroundColor: 'white', 
    }}
  >
      {/* Breadcrumb Navigation */}
      <Container sx={{ 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' },
          px: { xs: 2, sm: 3, lg: 4, xl: 5 },
          mx: 'auto'
        }} disableGutters>
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Box 
              component={Link} 
              href="/" 
              sx={{ 
                textDecoration: 'none', 
                color: theme.palette.primary.main,
                fontFamily: theme.typography.fontFamily,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              หน้าหลัก
            </Box>
            <Typography sx={{ 
              color: theme.palette.text.secondary,
              fontFamily: theme.typography.fontFamily
            }}>
              ติดต่อเรา
            </Typography>
          </Breadcrumbs>

        {/* Green Minimal Hero Section */}
        <Box sx={{ 
          mb: 4,
          textAlign: 'left',
          maxWidth: '1200px',
          mx: 'auto',
          px: { xs: 2, md: 0 }
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: 0,
                width: 60,
                height: 3,
                bgcolor: 'primary.main',
              }
            }}
          >
            ติดต่อเรา
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            เราพร้อมให้บริการและตอบคำถามทุกข้อสงสัยของคุณ
          </Typography>

        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 8, width: '100%', maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 0 } }}>
          {/* Contact Information */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 32px)' } }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 1,
                bgcolor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.03)'
              }}
            >
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: '1.125rem',
                  position: 'relative',
                  display: 'inline-block',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: 40,
                    height: 2,
                    bgcolor: 'primary.main'
                  }
                }}
              >
                ข้อมูลการติดต่อ
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <EmailIcon sx={{ mr: 2, color: 'primary.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>อีเมล</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <Link href="mailto:info@treetelu.com" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>
                        info@treetelu.com
                      </Link>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      เราจะตอบกลับภายใน 24 ชั่วโมงในวันทำการ
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <PhoneIcon sx={{ mr: 2, color: 'primary.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>โทรศัพท์</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <Link href="tel:+66862061354" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted #ccc' }}>
                        086-206-1354
                      </Link>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      จันทร์-อาทิตย์ 9:00-19:00 น.
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <AccessTimeIcon sx={{ mr: 2, color: 'primary.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>เวลาทำการ</Typography>
                    <Typography variant="body2">ทุกวัน: 9:00-19:00 น.</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
          
          {/* Social Media */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 32px)' } }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: '100%',
                borderRadius: 1,
                bgcolor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.03)'
              }}
            >
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{ 
                  mb: 4, 
                  fontWeight: 500,
                  color: 'text.primary',
                  fontSize: '1.125rem',
                  position: 'relative',
                  display: 'inline-block',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: 40,
                    height: 2,
                    bgcolor: 'primary.main'
                  }
                }}
              >
                Social Media
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<FacebookIcon />}
                  component={Link}
                  href="https://facebook.com/treetelu191"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'primary.main',
                    borderColor: 'rgba(0,0,0,0.12)',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    px: 3,
                    py: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  Facebook
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<InstagramIcon />}
                  component={Link}
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'primary.main',
                    borderColor: 'rgba(0,0,0,0.12)',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    px: 3,
                    py: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  Instagram
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill="currentColor">
                        <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                      </svg>
                    </Box>
                  }
                  component={Link}
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'primary.main',
                    borderColor: 'rgba(0,0,0,0.12)',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    px: 3,
                    py: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  TikTok
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18" fill="currentColor">
                        <path d="M272.1 204.2v71.1c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.1 0-2.1-.6-2.6-1.3l-32.6-44v42.2c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.8 0-3.2-1.4-3.2-3.2v-71.1c0-1.8 1.4-3.2 3.2-3.2H219c1 0 2.1.5 2.6 1.4l32.6 44v-42.2c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8-.1 3.3 1.4 3.3 3.1zm-82-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 1.8 1.4 3.2 3.2 3.2h11.4c1.8 0 3.2-1.4 3.2-3.2v-71.1c0-1.7-1.4-3.2-3.2-3.2zm-27.5 59.6h-31.1v-56.4c0-1.8-1.4-3.2-3.2-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 .9.3 1.6.9 2.2.6.5 1.3.9 2.2.9h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.7-1.4-3.2-3.1-3.2zM332.1 201h-45.7c-1.7 0-3.2 1.4-3.2 3.2v71.1c0 1.7 1.4 3.2 3.2 3.2h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2V234c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2v-11.4c-.1-1.7-1.5-3.2-3.2-3.2zM448 113.7V399c-.1 44.8-36.8 81.1-81.7 81H81c-44.8-.1-81.1-36.9-81-81.7V113c.1-44.8 36.9-81.1 81.7-81H367c44.8.1 81.1 36.8 81 81.7zm-61.6 122.6c0-73-73.2-132.4-163.1-132.4-89.9 0-163.1 59.4-163.1 132.4 0 65.4 58 120.2 136.4 130.6 19.1 4.1 16.9 11.1 12.6 36.8-.7 4.1-3.3 16.1 14.1 8.8 17.4-7.3 93.9-55.3 128.2-94.7 23.6-26 34.9-52.3 34.9-81.5z"/>
                      </svg>
                    </Box>
                  }
                  component={Link}
                  href="https://line.me/ti/p/~@095xrokt"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'primary.main',
                    borderColor: 'rgba(0,0,0,0.12)',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    px: 3,
                    py: 1.5,
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  Line
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
        
      </Container>
    </Box>
  );
}
