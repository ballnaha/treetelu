"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import { BlogPost } from '@/types/blog';

export default function AdminBlogsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // สำหรับการลบบทความ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // ฟังก์ชันสำหรับโหลดข้อมูลบทความ
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blogs');
      
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลบทความได้');
      }
      
      const data = await response.json();
      
      // เรียงลำดับบทความตามวันที่ (ล่าสุดก่อน)
      const sortedBlogs = data.sort((a: BlogPost, b: BlogPost) => b.id - a.id);
      
      setBlogs(sortedBlogs);
      setError('');
    } catch (err: any) {
      console.error('Error loading blogs:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };
  
  // โหลดข้อมูลเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  // ฟังก์ชันสำหรับเปิด dialog ยืนยันการลบ
  const handleDeleteClick = (blog: BlogPost) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };
  
  // ฟังก์ชันสำหรับปิด dialog ยืนยันการลบ
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBlogToDelete(null);
  };
  
  // ฟังก์ชันสำหรับลบบทความ
  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/blogs?id=${blogToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('ไม่สามารถลบบทความได้');
      }
      
      // อัปเดตรายการบทความ
      setBlogs(blogs.filter(blog => blog.id !== blogToDelete.id));
      setSuccess('ลบบทความเรียบร้อยแล้ว');
      
      // ปิด dialog
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    } catch (err: any) {
      console.error('Error deleting blog:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบบทความ');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // ฟังก์ชันสำหรับปิดการแจ้งเตือน
  const handleCloseAlert = () => {
    setSuccess('');
    setError('');
  };
  
  // ฟังก์ชันสำหรับไปยังหน้าแก้ไขบทความ
  const handleEditClick = (id: number) => {
    router.push(`/admin/edit-blog/${id}`);
  };
  
  // หากกำลังโหลดข้อมูล
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // แสดงผลในรูปแบบ Card สำหรับมือถือ
  const renderBlogCards = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {blogs.map((blog) => (
        <Box key={blog.id}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                {blog.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CategoryIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Chip
                  label={blog.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
                <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {blog.date}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                /{blog.slug}
              </Typography>
            </CardContent>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button
                  component={Link}
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  sx={{ 
                    flex: 1,
                    borderRadius: 2
                  }}
                >
                  ดู
                </Button>
                <Button
                  onClick={() => handleEditClick(blog.id)}
                  color="primary"
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ 
                    flex: 1,
                    borderRadius: 2
                  }}
                >
                  แก้ไข
                </Button>
                <Button
                  onClick={() => handleDeleteClick(blog)}
                  color="error"
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  sx={{ 
                    flex: 1,
                    borderRadius: 2
                  }}
                >
                  ลบ
                </Button>
              </Stack>
            </Box>
          </Card>
        </Box>
      ))}
    </Box>
  );
  
  // แสดงผลในรูปแบบตารางสำหรับหน้าจอขนาดใหญ่
  const renderBlogTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ชื่อบทความ</TableCell>
            <TableCell>หมวดหมู่</TableCell>
            <TableCell>วันที่เผยแพร่</TableCell>
            <TableCell align="right">การจัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {blogs.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {blog.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  /{blog.slug}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={blog.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{blog.date}</Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  component={Link}
                  href={`/blog/${blog.slug}`}
                  target="_blank"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleEditClick(blog.id)}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteClick(blog)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      pt: { xs: 8, sm: 9 },
      pb: 6
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              จัดการบทความสายมู
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/write-blog')}
              sx={{ borderRadius: 2 }}
            >
              เขียนบทความใหม่
            </Button>
          </Box>
          
          {blogs.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                ยังไม่มีบทความ
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => router.push('/admin/write-blog')}
              >
                เขียนบทความใหม่
              </Button>
            </Box>
          ) : (
            <>
              {/* แสดงตารางสำหรับจอขนาดใหญ่ */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                {renderBlogTable()}
              </Box>
              
              {/* แสดงการ์ดสำหรับมือถือ */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {renderBlogCards()}
              </Box>
            </>
          )}
        </Paper>
      </Container>
      
      {/* Dialog ยืนยันการลบบทความ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>ยืนยันการลบบทความ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการลบบทความ "{blogToDelete?.title}" ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : undefined}
          >
            {deleteLoading ? 'กำลังลบ...' : 'ลบบทความ'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* แสดงการแจ้งเตือน */}
      <Snackbar open={!!success || !!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert 
          onClose={handleCloseAlert} 
          severity={success ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 