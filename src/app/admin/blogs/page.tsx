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
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { BlogPost } from '@/types/blog';

export default function AdminBlogsPage() {
  const router = useRouter();
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
  
  return (
    <Box sx={{ py: 5, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              จัดการบทความ
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/write-blog')}
            >
              เขียนบทความใหม่
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {blogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ยังไม่มีบทความในระบบ
              </Typography>
              <Button
                variant="outlined"
                onClick={() => router.push('/admin/write-blog')}
                startIcon={<AddIcon />}
              >
                เริ่มเขียนบทความแรก
              </Button>
            </Box>
          ) : (
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
          )}
        </Paper>
      </Container>
      
      {/* Dialog ยืนยันการลบ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          ยืนยันการลบบทความ
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            คุณต้องการลบบทความ "{blogToDelete?.title}" ใช่หรือไม่?
            <br />
            การกระทำนี้ไม่สามารถเรียกคืนได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleteLoading ? 'กำลังลบ...' : 'ลบบทความ'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* แจ้งเตือน */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 