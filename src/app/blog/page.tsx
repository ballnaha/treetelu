'use client';

import { Container, Typography, Box, Card, CardContent, Link as MuiLink, Breadcrumbs } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Footer from '@/components/Footer';

const blogPosts = [
  {
    id: 1,
    title: 'ต้นไม้มงคลตามทิศเหนือ',
    excerpt: 'เรียนรู้เกี่ยวกับต้นไม้มงคลที่เหมาะสำหรับทิศเหนือ ตามหลักฮวงจุ้ย',
    image: '/images/blog/north.jpg',
    slug: 'ต้นไม้มงคลตามทิศเหนือ',
    date: '20 มีนาคม 2024'
  },
  {
    id: 2,
    title: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    excerpt: 'แนะนำต้นไม้เสริมดวงที่เหมาะสำหรับทิศตะวันออก',
    image: '/images/blog/east.jpg',
    slug: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    date: '19 มีนาคม 2024'
  },
  {
    id: 3,
    title: 'ต้นไม้เสริมโชคลาภทิศใต้',
    excerpt: 'ต้นไม้เสริมโชคลาภที่เหมาะสำหรับทิศใต้',
    image: '/images/blog/south.jpg',
    slug: 'ต้นไม้เสริมโชคลาภทิศใต้',
    date: '18 มีนาคม 2024'
  },
  {
    id: 4,
    title: 'ต้นไม้เสริมความรักทิศตะวันตก',
    excerpt: 'ต้นไม้เสริมความรักที่เหมาะสำหรับทิศตะวันตก',
    image: '/images/blog/west.jpg',
    slug: 'ต้นไม้เสริมความรักทิศตะวันตก',
    date: '17 มีนาคม 2024'
  },
  {
    id: 5,
    title: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    excerpt: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    image: '/images/blog/money-tree.jpg',
    slug: '5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    date: '16 มีนาคม 2024'
  },
  {
    id: 6,
    title: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    excerpt: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    image: '/images/blog/negative-energy.jpg',
    slug: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    date: '15 มีนาคม 2024'
  },
  {
    id: 7,
    title: '5 ต้นไม้เสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    excerpt: 'แนะนำต้นไม้ที่ช่วยเสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    image: '/images/blog/work.jpg',
    slug: '5-ต้นไม้เสริมการทำงาน-เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    date: '23 มีนาคม 2024',
  },
  
];

export default function BlogPage() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
              บทความ
            </Typography>
          </Breadcrumbs>

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
              บทความ
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              บทความที่มีความสำคัญต่อคุณ
            </Typography>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 4,
              width: '100%'
            }}
          >
            {blogPosts.map((post) => (
              <Card 
                key={post.id}
                elevation={0}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  border: 1,
                  borderColor: theme.palette.divider,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 240,
                    overflow: 'hidden'
                  }}
                >
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    style={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography 
                    variant="h2" 
                    component="h2" 
                    sx={{ 
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      mb: 1,
                      lineHeight: 1.4
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 4, 
                        height: 4, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.primary.main 
                      }} 
                    />
                    {post.date}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {post.excerpt}
                  </Typography>
                  <MuiLink
                    component={Link}
                    href={`/blog/${post.slug}`}
                    color="primary"
                    sx={{ 
                      textDecoration: 'none',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        textDecoration: 'underline',
                        '& .arrow': {
                          transform: 'translateX(4px)'
                        }
                      }
                    }}
                  >
                    อ่านเพิ่มเติม
                    <Box 
                      component="span" 
                      className="arrow"
                      sx={{ 
                        transition: 'transform 0.2s ease-in-out',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      →
                    </Box>
                  </MuiLink>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
} 