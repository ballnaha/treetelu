"use client";

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Chip, Alert, Skeleton } from '@mui/material';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Link from 'next/link';

// Styled components
const BlogHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  position: 'relative',
}));

const BlogImage = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '600px',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    height: '400px',
  },
  [theme.breakpoints.down('sm')]: {
    height: '300px',
  },
}));

const BlogContentWrapper = styled(Box)(({ theme }) => ({
  lineHeight: '1.8',
  fontSize: '1.1rem',
  color: '#333',
  maxWidth: '800px',
  margin: '0 auto',
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    margin: '32px 0',
  },
  '& h2, & h3, & h4': {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(3),
    fontWeight: 600,
    color: '#111',
  },
  '& p': {
    marginBottom: theme.spacing(3),
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    borderBottom: '1px solid transparent',
    transition: 'border-color 0.2s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& blockquote': {
    borderLeft: '2px solid #ddd',
    paddingLeft: theme.spacing(3),
    fontStyle: 'italic',
    color: '#555',
    margin: `${theme.spacing(4)} 0`,
  },
  '& ul, & ol': {
    paddingLeft: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
}));

const ShareButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
  padding: theme.spacing(1),
  transition: 'opacity 0.2s ease',
  '&:hover': {
    opacity: 0.7,
  },
}));

const MetaInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  color: '#666',
  flexWrap: 'wrap',
  margin: `${theme.spacing(3)} 0`,
}));

const MetaItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: '0.9rem',
}));

interface BlogDetailClientProps {
  slug: string;
}

export default function BlogDetailClient({ slug }: BlogDetailClientProps) {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchBlogData() {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/blogs?slug=${slug}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store',
          },
        });
        
        if (!res.ok) {
          const errorStatus = res.status;
          if (errorStatus === 404) {
            throw new Error('ไม่พบบทความที่คุณกำลังหา');
          } else {
            throw new Error(`เกิดข้อผิดพลาดในการโหลดข้อมูล (${errorStatus})`);
          }
        }
        
        const data = await res.json();
        setBlog(data);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลบทความได้ โปรดลองอีกครั้งในภายหลัง');
      } finally {
        setLoading(false);
      }
    }

    fetchBlogData();
  }, [slug]);

  const handleShareToFacebook = () => {
    const url = typeof window !== 'undefined' 
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
      : '#';
    window.open(url, '_blank', 'width=600,height=400');
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '1200px', py: 8 }}>
        <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={500} sx={{ mb: 4 }} />
        <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} width="100%" />
        <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} width="100%" />
        <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} width="90%" />
      </Container>
    );
  }

  // Error state
  if (error || !blog) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '1200px', py: 8 }}>
        <Alert 
          severity="error" 
          sx={{ 
            padding: 3, 
            fontSize: '1.1rem',
          }}
        >
          {error || 'ไม่พบบทความที่คุณกำลังหา'}
        </Alert>
      </Container>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '';
    
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const displayDate = blog.date || (blog.createdAt && formatDate(blog.createdAt));
  
  // ประมาณเวลาในการอ่าน (สมมติว่า 200 คำต่อนาที)
  const readingTime = () => {
    const wordCount = blog.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} นาที`;
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: '1200px', py: 8 }}>
      <BlogHeader>
        <Link href="/blog" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.9rem', display: 'inline-block', marginBottom: 2 }}>
          ← กลับไปยังบทความทั้งหมด
        </Link>
        
        <Typography variant="h2" component="h1" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.2 }}>
          {blog.title}
        </Typography>
        
        <MetaInfo>
          <MetaItem>
            <CalendarTodayIcon fontSize="small" />
            <Typography variant="body2">
              {displayDate}
            </Typography>
          </MetaItem>
          
          <MetaItem>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2">
              {readingTime()}
            </Typography>
          </MetaItem>
          
          <MetaItem>
            <CategoryIcon fontSize="small" />
            <Chip 
              label={blog.category} 
              size="small" 
              variant="outlined"
              sx={{ 
                height: '24px',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '4px',
              }}
            />
          </MetaItem>
          
          <ShareButton onClick={handleShareToFacebook} sx={{ marginLeft: { md: 'auto' } }}>
            <ShareIcon fontSize="small" />
            <FacebookIcon fontSize="small" />
          </ShareButton>
        </MetaInfo>
        
        <Typography 
          variant="subtitle1" 
          gutterBottom
          sx={{ 
            fontSize: '1.2rem', 
            fontWeight: 400, 
            color: '#555',
            mb: 4,
            fontStyle: 'italic'
          }}
        >
          {blog.excerpt}
        </Typography>
      </BlogHeader>
      
      {blog.image && (
        <BlogImage>
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </BlogImage>
      )}
      
      <BlogContentWrapper>
        <div dangerouslySetInnerHTML={{ __html: blog.content }} />
      </BlogContentWrapper>
      
      <Divider sx={{ my: 6 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {blog.updatedAt && `อัปเดตล่าสุด: ${formatDate(blog.updatedAt)}`}
        </Typography>
        
        <Chip 
          label={`บทความเกี่ยวกับ: ${blog.category}`} 
          size="small"
          sx={{ 
            fontWeight: 400,
            backgroundColor: '#f5f5f5',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
        />
      </Box>
    </Container>
  );
} 