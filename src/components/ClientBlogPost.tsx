'use client';

import { 
  Container, 
  Typography, 
  Box, 
  Link as MuiLink, 
  Breadcrumbs, 
  Divider,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Footer from '@/components/Footer';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
  date: string;
  category: string;
  content: string;
}

interface ClientBlogPostProps {
  post: BlogPost | undefined;
}

export default function ClientBlogPost({ post }: ClientBlogPostProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!post) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Box sx={{ flex: '1 0 auto' }}>
          <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h5" color="text.secondary">
              ไม่พบบทความที่คุณต้องการ
            </Typography>
            <MuiLink 
              component={Link} 
              href="/blog" 
              sx={{ 
                display: 'inline-block', 
                mt: 2,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              กลับไปยังหน้าบทความ
            </MuiLink>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      <Box sx={{ flex: '1 0 auto' }}>
        <Container maxWidth={false} sx={{ 
          py: 4, 
          px: { xs: 2, sm: 3, lg: 4, xl: 5 }, 
          maxWidth: { xs: '100%', sm: '100%', md: '1200px', xl: '1200px' }, 
          mx: 'auto',
        }}>
          {/* Breadcrumbs */}
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
            <Box 
              component={Link} 
              href="/blog" 
              sx={{ 
                textDecoration: 'none', 
                fontFamily: theme.typography.fontFamily,
                color: theme.palette.primary.main,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              บทความ
            </Box>
            
            <Typography color="text.primary">
                {post.title}
              </Typography>
          </Breadcrumbs>

            {/* หมวดหมู่และวันที่ */}
            <Box sx={{ mb: 6, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={post.category} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {post.date}
              </Typography>
            </Box>

            {/* หัวข้อบทความ */}
            <Typography 
              variant="h4" 
              component="h4" 
              sx={{ 
                mb: 4,
                fontWeight: 500,
                letterSpacing: -0.5,
                lineHeight: 1.2
              }}
            >
              {post.title}
            </Typography>

            {/* รูปภาพหลัก */}
            <Box 
              sx={{ 
                position: 'relative', 
                width: '100%', 
                height: { xs: 300, sm: 400, md: 500 },
                mb: 6,
                overflow: 'hidden',
                borderRadius: 1,
              }}
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                style={{ 
                  objectFit: 'cover'
                }}
              />
            </Box>

            {/* เนื้อหาบทความ */}
            <Box 
              sx={{ 
                '& p': { 
                  fontSize: '1.05rem',
                  lineHeight: 1.8,
                  mb: 3,
                  color: 'text.primary',
                  maxWidth: { sm: '90%', md: '80%' },
                },
                '& h2': {
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  my: 4,
                  color: 'text.primary'
                },
                '& h3': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  my: 3,
                  color: 'text.primary'
                },
                '& ul, & ol': {
                  pl: 4,
                  mb: 4,
                  '& li': {
                    mb: 1.5,
                    fontSize: '1.05rem',
                    lineHeight: 1.6
                  }
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 1,
                  my: 4
                }
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Divider sx={{ my: 8 }} />

            {/* ลิงก์กลับไปยังหน้าบทความทั้งหมด */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <MuiLink 
                component={Link} 
                href="/blog" 
                sx={{ 
                  display: 'inline-block',
                  fontSize: '1rem',
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                ← กลับไปยังบทความทั้งหมด
              </MuiLink>
            </Box>
          </Container>
        </Box>
        <Footer />
      </Box>
  );
} 