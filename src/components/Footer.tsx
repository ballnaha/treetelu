'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Link, Stack, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Footer() {
  const theme = useTheme();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // useEffect เพื่อตรวจสอบว่า component ถูก mount บน client แล้ว
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ไม่แสดง Footer ในหน้าแรก
  if (pathname === '/') {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: '#1D9679',
        color: 'white',
        marginTop: '50px',
        
      }}
    >
      <Container maxWidth="lg">
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1.5} 
          justifyContent="space-between" 
          alignItems="center"
        >
          <Typography 
            variant="body2" 
            align="center"
            sx={{ 
              fontSize: '0.75rem',
              opacity: 0.9
            }}
          >
            © {new Date().getFullYear()} Treetelu ต้นไม้ในกระถาง. สงวนลิขสิทธิ์
          </Typography>
          
          {isMounted && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Line ID: @095xrokt" arrow>
                  <IconButton 
                    size="small" 
                    component={Link} 
                    href="https://line.me/ti/p/~@095xrokt" 
                    target="_blank"
                    rel="noopener"
                    sx={{ 
                      color: 'white',
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'transparent'
                      },
                      p: 0.5
                    }}
                  >
                    <Box
                      sx={{ 
                        position: 'relative',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Image
                        src="/line-icon.png"
                        alt="Line"
                        width={20}
                        height={20}
                        style={{
                          
                          maxWidth: '100%',
                          height: 'auto'
                        }}
                      />
                    </Box>
                  </IconButton>
                </Tooltip>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.75rem',
                    opacity: 0.9
                  }}
                >
                  Line: @095xrokt
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <IconButton 
                  size="small" 
                  component={Link} 
                  href="https://facebook.com" 
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    color: 'white',
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <FacebookIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  component={Link} 
                  href="https://instagram.com" 
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    color: 'white',
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <InstagramIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
} 