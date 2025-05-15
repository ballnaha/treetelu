'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { useRouter } from 'next/navigation';

// Interface สำหรับข้อมูลหมวดหมู่
interface Category {
  id: number;
  categoryName: string;
  categoryDesc?: string;
  status: 'on' | 'off';
  priority: number;
  bestseller: 'on' | 'off';
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesClient() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // สถานะต่างๆ
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    categoryName: '',
    categoryDesc: '',
    status: 'off' as 'on' | 'off',
    priority: 0,
    bestseller: 'off' as 'on' | 'off'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // โหลดข้อมูลหมวดหมู่
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่');
      }

      // ตรวจสอบและแปลงข้อมูลให้เป็น array
      const categoriesArray = Array.isArray(data) ? data : 
                            (data.categories && Array.isArray(data.categories)) ? data.categories : 
                            [];
      
      setCategories(categoriesArray);
      setError('');
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      setCategories([]); // กำหนดค่าเริ่มต้นเป็น array ว่างเมื่อเกิดข้อผิดพลาด
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเปิด/ปิด Dialog
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        categoryName: category.categoryName,
        categoryDesc: category.categoryDesc || '',
        status: category.status,
        priority: category.priority,
        bestseller: category.bestseller
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        categoryName: '',
        categoryDesc: '',
        status: 'off',
        priority: 0,
        bestseller: 'off'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setFormData({
      categoryName: '',
      categoryDesc: '',
      status: 'off',
      priority: 0,
      bestseller: 'off'
    });
  };

  // จัดการการเปลี่ยนแปลงข้อมูลฟอร์ม
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 'on' : 'off'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // บันทึกข้อมูลหมวดหมู่
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = selectedCategory 
        ? `/api/admin/categories/${selectedCategory.id}`
        : '/api/admin/categories';
      
      const method = selectedCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: formData.status,
          bestseller: formData.bestseller
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      // รีเฟรชข้อมูลหลังจากบันทึก
      await fetchCategories();
      
      // ปิด dialog และรีเซ็ตฟอร์ม
      handleCloseDialog();
      setFormData({
        categoryName: '',
        categoryDesc: '',
        status: 'off',
        priority: 0,
        bestseller: 'off'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ยืนยันการลบหมวดหมู่
  const handleDeleteConfirm = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  // ลบหมวดหมู่
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      }

      // รีเฟรชข้อมูลหลังจากลบ
      await fetchCategories();
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* หัวข้อหน้า */}
      <Box sx={{ 
        mb: { xs: 2, sm: 4 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            จัดการหมวดหมู่สินค้า
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            เพิ่ม แก้ไข หรือลบหมวดหมู่สินค้าในร้านค้า
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          sx={{ 
            minWidth: { xs: '100%', sm: 120 },
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          เพิ่มหมวดหมู่
        </Button>
      </Box>

      {/* แสดงข้อความข้อผิดพลาด */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* แสดงข้อมูลหมวดหมู่ */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Mobile View */}
          {isMobile ? (
            <Stack spacing={2}>
              {categories.map((category) => (
                <Card key={category.id} variant="outlined">
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {category.categoryName}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {category.categoryDesc || '-'}
                    </Typography>
                    
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          ลำดับความสำคัญ
                        </Typography>
                        <Typography variant="body2">
                          {category.priority || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          สถานะ
                        </Typography>
                        <Chip 
                          label={category.status === 'on' ? 'แสดงผล' : 'ซ่อน'} 
                          color={category.status === 'on' ? 'success' : 'default'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          สินค้าขายดี
                        </Typography>
                        <Chip 
                          label={category.bestseller === 'on' ? 'สินค้าขายดี' : 'ปกติ'} 
                          color={category.bestseller === 'on' ? 'warning' : 'default'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(category)}
                        variant="outlined"
                      >
                        แก้ไข
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteConfirm(category)}
                        variant="outlined"
                        color="error"
                      >
                        ลบ
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            /* Desktop View */
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.neutral' }}>
                    <TableCell>ชื่อหมวดหมู่</TableCell>
                    <TableCell>คำอธิบาย</TableCell>
                    <TableCell>ลำดับความสำคัญ</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>สินค้าขายดี</TableCell>
                    <TableCell align="center">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>
                        <Typography variant="body2">{category.categoryName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {category.categoryDesc || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.priority || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category.status === 'on' ? 'แสดงผล' : 'ซ่อน'} 
                          color={category.status === 'on' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category.bestseller === 'on' ? 'สินค้าขายดี' : 'ปกติ'} 
                          color={category.bestseller === 'on' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(category)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteConfirm(category)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog สำหรับเพิ่ม/แก้ไขหมวดหมู่ */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            height: isMobile ? '100%' : 'auto'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.neutral',
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: isMobile ? 'sticky' : 'static',
            top: 0,
            zIndex: 1,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          {selectedCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: { xs: 2, sm: 3 },
          pb: { xs: 8, sm: 3 } // เพิ่ม padding ด้านล่างสำหรับมือถือเพื่อให้มีพื้นที่สำหรับปุ่ม
        }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ชื่อหมวดหมู่"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleInputChange}
              required
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
            
            <TextField
              fullWidth
              label="คำอธิบาย"
              name="categoryDesc"
              value={formData.categoryDesc}
              onChange={handleInputChange}
              multiline
              rows={isMobile ? 2 : 3}
              margin="normal"
              size={isMobile ? "small" : "medium"}
            />
            
            <TextField
              fullWidth
              label="ลำดับการแสดงผล"
              name="priority"
              type="number"
              value={formData.priority}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ min: 0 }}
              size={isMobile ? "small" : "medium"}
            />
            
            <Stack spacing={1} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 'on'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      status: e.target.checked ? 'on' : 'off'
                    }))}
                    name="status"
                  />
                }
                label="แสดงผล"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.bestseller === 'on'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bestseller: e.target.checked ? 'on' : 'off'
                    }))}
                    name="bestseller"
                  />
                }
                label="หมวดหมู่สินค้าขายดี"
              />
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'background.neutral',
          borderTop: '1px solid',
          borderColor: 'divider',
          position: isMobile ? 'fixed' : 'static',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1
        }}>
          <Button 
            onClick={handleCloseDialog}
            color="inherit"
            variant="outlined"
            fullWidth={isMobile}
            sx={{ 
              minWidth: { xs: '100%', sm: 100 },
              borderRadius: '4px',
              borderColor: 'divider',
              mb: isMobile ? 1 : 0
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth={isMobile}
            sx={{ 
              minWidth: { xs: '100%', sm: 100 },
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
            height: isMobile ? 'auto' : 'auto'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.neutral',
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          ยืนยันการลบหมวดหมู่
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body1" gutterBottom>
            คุณต้องการลบหมวดหมู่ "{categoryToDelete?.categoryName}" ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            การดำเนินการนี้ไม่สามารถยกเลิกได้ และสินค้าทั้งหมดในหมวดหมู่นี้จะถูกย้ายไปยังหมวดหมู่ "ไม่ระบุหมวดหมู่"
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'background.neutral',
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            variant="outlined"
            fullWidth={isMobile}
            sx={{ 
              minWidth: { xs: '100%', sm: 100 },
              borderRadius: '4px',
              borderColor: 'divider'
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            fullWidth={isMobile}
            sx={{ 
              minWidth: { xs: '100%', sm: 100 },
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)'
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 