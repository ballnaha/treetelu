'use client';

import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BlogPost } from '@/types/blog';

export default function BlogPage() {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>(['ทั้งหมด']);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [error, setError] = useState('');

  // กรองบทความตามหมวดหมู่
  const filteredPosts = blogPosts.filter(post => 
    selectedCategory === 'ทั้งหมด' || post.category === selectedCategory
  );

  // โหลดข้อมูลบทความและหมวดหมู่
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ดึงข้อมูลบทความทั้งหมดจาก API
        const response = await fetch('/api/blogs');
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลบทความได้');
        }
        const blogs = await response.json() as BlogPost[];
        setBlogPosts(blogs);
        
        // สร้างรายการหมวดหมู่ที่ไม่ซ้ำกัน
        const categorySet = new Set<string>();
        blogs.forEach(blog => {
          if (blog.category) {
            categorySet.add(blog.category);
          }
        });
        setAllCategories(['ทั้งหมด', ...Array.from(categorySet)]);
        
        setError('');
      } catch (err: any) {
        console.error('Error fetching blog data:', err);
        setError(err.message || 'ไม่สามารถโหลดข้อมูลบทความได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
        py: 0, 
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

        {/* แสดงสถานะโหลดข้อมูล */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {/* แสดงข้อความเมื่อมีข้อผิดพลาด */}
        {error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </Box>
        )}

        {/* แสดงข้อความเมื่อไม่มีบทความ */}
        {!loading && !error && filteredPosts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              ไม่พบบทความในหมวดหมู่ {selectedCategory}
            </Typography>
            {selectedCategory !== 'ทั้งหมด' && (
              <Button 
                variant="text" 
                color="primary" 
                onClick={() => setSelectedCategory('ทั้งหมด')}
                sx={{ mt: 2 }}
              >
                ดูบทความทั้งหมด
              </Button>
            )}
          </Box>
        )}

        {/* บทความทั้งหมด */}
        {!loading && !error && filteredPosts.length > 0 && (
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
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {post.date}
                    </Typography>
                    <Typography 
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '1.1rem',
                        transition: 'color 0.2s ease',
                        lineHeight: 1.3
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                      }}
                    >
                      {post.excerpt}
                    </Typography>
                    <Typography 
                      component="span" 
                      variant="body2" 
                      sx={{ 
                        display: 'inline-block',
                        mt: 1,
                        color: theme.palette.primary.main,
                        fontWeight: 500
                      }}
                    >
                      อ่านเพิ่มเติม
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
} 