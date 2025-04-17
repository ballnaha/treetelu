'use client';

import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Link as MuiLink, 
  Breadcrumbs,
  Divider,
  Chip,
  Button
} from '@mui/material';
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
    date: '20 มีนาคม 2024',
    category: 'ฮวงจุ้ย'
  },
  {
    id: 2,
    title: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    excerpt: 'แนะนำต้นไม้เสริมดวงที่เหมาะสำหรับทิศตะวันออก',
    image: '/images/blog/east.jpg',
    slug: 'ต้นไม้เสริมดวงตามทิศตะวันออก',
    date: '19 มีนาคม 2024',
    category: 'ฮวงจุ้ย'
  },
  {
    id: 3,
    title: 'ต้นไม้เสริมโชคลาภทิศใต้',
    excerpt: 'ต้นไม้เสริมโชคลาภที่เหมาะสำหรับทิศใต้',
    image: '/images/blog/south.jpg',
    slug: 'ต้นไม้เสริมโชคลาภทิศใต้',
    date: '18 มีนาคม 2024',
    category: 'ฮวงจุ้ย'
  },
  {
    id: 4,
    title: 'ต้นไม้เสริมความรักทิศตะวันตก',
    excerpt: 'ต้นไม้เสริมความรักที่เหมาะสำหรับทิศตะวันตก',
    image: '/images/blog/west.jpg',
    slug: 'ต้นไม้เสริมความรักทิศตะวันตก',
    date: '17 มีนาคม 2024',
    category: 'ฮวงจุ้ย'
  },
  {
    id: 5,
    title: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    excerpt: '5 ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    image: '/images/blog/money-tree.jpg',
    slug: '5-ต้นไม้มงคลที่ช่วยเสริมโชคลาภการเงิน',
    date: '16 มีนาคม 2024',
    category: 'ความเชื่อ'
  },
  {
    id: 6,
    title: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    excerpt: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    image: '/images/blog/negative-energy.jpg',
    slug: 'ต้นไม้ดูดพลังงานลบและวิธีดูแลให้ถูกต้อง',
    date: '15 มีนาคม 2024',
    category: 'ความเชื่อ'
  },
  {
    id: 7,
    title: '5 ต้นไม้เสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    excerpt: 'แนะนำต้นไม้ที่ช่วยเสริมการทำงาน เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    image: '/images/blog/work.jpg',
    slug: '5-ต้นไม้เสริมการทำงาน-เพิ่มประสิทธิภาพและความคิดสร้างสรรค์',
    date: '23 มีนาคม 2024',
    category: 'ความเชื่อ'
  },
];

export default function BlogPage() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  // ดึงหมวดหมู่ทั้งหมด
  const allCategories = ['ทั้งหมด', ...Array.from(new Set(blogPosts.map(post => post.category)))];
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  // กรองบทความตามหมวดหมู่
  const filteredPosts = blogPosts.filter(post => 
    selectedCategory === 'ทั้งหมด' || post.category === selectedCategory
  );

  // เลือกเฉพาะบทความแรกเพื่อแสดงในส่วน featured
  const featuredPost = blogPosts[0];
  const remainingPosts = blogPosts.slice(1);

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
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
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
          อ่านบทความทั้งหมดของเรา หรือค้นหาตามหมวดหมู่ที่คุณสนใจ
        </Typography>
        
        {/* หมวดหมู่ */}
        <Box sx={{ mb: 8, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {allCategories.map(category => (
            <Chip 
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "filled" : "outlined"}
              color="primary"
              sx={{ 
                borderRadius: '4px',
                opacity: selectedCategory === category ? 1 : 0.7,
                fontWeight: selectedCategory === category ? 500 : 400,
                '&:hover': {
                  opacity: 0.9
                }
              }}
            />
          ))}
        </Box>

 

        {/* บทความทั้งหมด */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            columnGap: 6,
            rowGap: 6
          }}
        >
          {filteredPosts.map((post) => (
            <Box 
              key={post.id}
              component={Link}
              href={`/blog/${post.slug}`}
              sx={{ 
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'all 0.2s ease',
                '&:hover img': {
                  transform: 'scale(1.05)'
                },
                '&:hover h3': {
                  color: theme.palette.primary.main
                }
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 3,
                  height: '100%'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: { xs: '100%', sm: 120 },
                    height: { xs: 200, sm: 120 },
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    style={{ 
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {post.date} · {post.category}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      transition: 'color 0.2s ease',
                      lineHeight: 1.4
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: { xs: 'none', sm: '-webkit-box' },
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6
                    }}
                  >
                    {post.excerpt}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}