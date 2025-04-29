'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Stack,
  Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

// รูปแบบข้อมูลผู้ใช้
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: 'true' | 'false';
  createdAt: string;
  emailVerifiedAt: string | null;
}

// ส่วนประกอบหลักของหน้า users
export default function UsersClient() {
  const { user, getAuthToken } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // สถานะภายในคอมโพเนนต์
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showInactiveUsers, setShowInactiveUsers] = useState(true);
  
  // สถานะสำหรับการยืนยันการลบ
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // เพิ่ม state สำหรับ edit dialog
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    isAdmin: 'false',
    emailVerified: false
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<boolean>(false);
  
  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = getAuthToken();
        
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(true);
          fetchUsers();
        } else {
          setIsAdmin(false);
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        router.push('/');
      }
    };
    
    checkAdminStatus();
  }, [router, getAuthToken]);
  
  // ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      const response = await fetch(`/api/admin/users?showInactive=${showInactiveUsers}`, {
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
      }
      
      const data = await response.json();
      
      if (data.success && data.users) {
        setUsers(data.users);
        applyFilters(data.users, searchTerm, showInactiveUsers);
        setError('');
      } else {
        throw new Error(data.message || 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน');
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชั่นลบผู้ใช้
  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      // เก็บค่า response text ก่อนเพื่อการดีบัก
      const responseText = await response.text();
      console.log('Response from server:', responseText);
      
      // พยายามแปลง response เป็น JSON
      let data;
      try {
        // ถ้า response text เป็น JSON ที่ถูกต้อง
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError, 'Response text:', responseText);
        
        // ถ้า response text ไม่ใช่ JSON ที่ถูกต้อง สร้าง object สำหรับแสดงข้อผิดพลาด
        data = { 
          success: false,
          message: `ข้อมูลตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง (HTTP ${response.status})`,
          responseText
        };
      }
      
      if (!response.ok) {
        throw new Error(data.message || data.details || `ไม่สามารถลบผู้ใช้งานได้ (HTTP ${response.status})`);
      }
      
      if (data.success) {
        // ปิด dialog ยืนยันการลบเมื่อสำเร็จ
        setDeleteConfirmOpen(false);
        
        // อัปเดตรายการผู้ใช้
        fetchUsers();
        setError('');
      } else {
        throw new Error(data.message || 'ไม่สามารถลบผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      let errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน';
      setError(errorMessage);
      
      // แสดงข้อผิดพลาดแต่ปิด dialog
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันกรองข้อมูลผู้ใช้ตามการค้นหา
  const applyFilters = (allUsers: User[], search: string, showInactive: boolean) => {
    const filtered = allUsers.filter(user => {
      // กรองตามการค้นหา
      const searchMatch = search === '' || 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase());
      
      // กรองตามสถานะการยืนยันอีเมล
      // ถ้า showInactive เป็น true จะแสดงทั้งหมด ถ้าเป็น false จะแสดงเฉพาะที่ยืนยันอีเมลแล้ว
      const verificationMatch = showInactive ? true : user.emailVerifiedAt !== null;
      
      return searchMatch && verificationMatch;
    });
    
    setFilteredUsers(filtered);
  };
  
  // Effect เมื่อการค้นหาเปลี่ยน ให้กรองข้อมูลจากแคชที่มีอยู่
  useEffect(() => {
    applyFilters(users, searchTerm, showInactiveUsers);
  }, [searchTerm, users]);
  
  // Effect เมื่อ showInactiveUsers เปลี่ยน ให้ดึงข้อมูลใหม่จาก API
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [showInactiveUsers]);
  
  // การจัดการหน้าตาราง
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // เปิดกล่องยืนยันการลบ
  const handleOpenDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };
  
  // ไปที่หน้าแก้ไขผู้ใช้
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin === 'true' ? 'true' : 'false',
      emailVerified: user.emailVerifiedAt !== null
    });
    setEditError(null);
    setEditSuccess(false);
    setOpenEditDialog(true);
  };
  
  // ไปที่หน้าเพิ่มผู้ใช้ใหม่
  const handleAddUser = () => {
    router.push('/admin/users/add');
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleEditDialogClose = () => {
    if (!editLoading) {
      setOpenEditDialog(false);
      setUserToEdit(null);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!userToEdit) return;
    
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify(editFormData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
      }
      
      // อัปเดตข้อมูลผู้ใช้ในรายการ
      setUsers(users.map(user => 
        user.id === userToEdit.id ? data.user : user
      ));
      
      setEditSuccess(true);
      
      // ปิด dialog หลังจากสำเร็จ
      setTimeout(() => {
        setOpenEditDialog(false);
        setUserToEdit(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setEditError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    } finally {
      setEditLoading(false);
    }
  };
  
  // แสดงหน้าโหลดข้อมูล
  if (isAdmin === null || loading && !users.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูล...</Typography>
        </Box>
      </Container>
    );
  }
  
  // ถ้าไม่ใช่ admin ให้แสดงข้อความ
  if (isAdmin === false) {
    return <Container sx={{ p: 4 }}><Typography>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Container>;
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 3, position: 'relative' }}>
      {/* แสดง Loading Overlay เมื่อกำลังโหลดข้อมูลและมี users อยู่แล้ว */}
      {loading && users.length > 0 && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9999,
          }}
        >
          <Paper 
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูล...</Typography>
          </Paper>
        </Box>
      )}
    
      {/* ส่วนหัวของหน้า */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            จัดการผู้ใช้งาน
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ Tree Telu
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </Button>
          
          <Button 
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
          >
            เพิ่มผู้ใช้
          </Button>
        </Box>
      </Box>
      
      {/* แสดงข้อความข้อผิดพลาด */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* ส่วนการค้นหาและตัวกรอง */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2 
          }}>
            <TextField
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: { sm: '50%', md: '40%' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showInactiveUsers}
                  onChange={(e) => setShowInactiveUsers(e.target.checked)}
                />
              }
              label="แสดงผู้ใช้ที่ยังไม่ยืนยันอีเมล"
              sx={{ mr: 0 }}
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* ตารางแสดงรายชื่อผู้ใช้ */}
      {isMobile ? (
        /* Mobile View - Card Layout */
        <Box>
          {filteredUsers.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ไม่มีผู้ใช้งานในระบบ'}
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <Card 
                    key={user.id} 
                    variant="outlined"
                    sx={{
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* ชื่อ-นามสกุล */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          
                          <Chip 
                            icon={user.isAdmin === 'true' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                            label={user.isAdmin === 'true' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'} 
                            color={user.isAdmin === 'true' ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                        
                        {/* อีเมล */}
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        
                        <Divider />
                        
                        {/* สถานะและวันที่สมัคร */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              สมัครเมื่อ: {new Date(user.createdAt).toLocaleDateString('th-TH')}
                            </Typography>
                          </Box>
                          
                          <Chip 
                            label={user.emailVerifiedAt ? 'ยืนยันอีเมลแล้ว' : 'ยังไม่ยืนยันอีเมล'} 
                            color={user.emailVerifiedAt ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        
                        {/* ปุ่มจัดการ */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                          <Tooltip title="แก้ไข">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditUser(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteConfirm(user)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          )}
          
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage=""
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </Box>
      ) : (
        /* Desktop View - Table Layout */
        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>ชื่อ-นามสกุล</TableCell>
                <TableCell>อีเมล</TableCell>
                <TableCell>บทบาท</TableCell>
                <TableCell>สมัครเมื่อ</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="right">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow 
                      key={user.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {user.firstName} {user.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={user.isAdmin === 'true' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                          label={user.isAdmin === 'true' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'} 
                          color={user.isAdmin === 'true' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.emailVerifiedAt ? 'ยืนยันอีเมลแล้ว' : 'ยังไม่ยืนยันอีเมล'} 
                          color={user.emailVerifiedAt ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="แก้ไข">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditUser(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteConfirm(user)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ไม่มีผู้ใช้งานในระบบ'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="แถวต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
          />
        </TableContainer>
      )}
      
      {/* ไดอะล็อกยืนยันการลบผู้ใช้ */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการลบผู้ใช้ <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ใช่หรือไม่? 
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
          <Button 
            color="error" 
            onClick={() => userToDelete && deleteUser(userToDelete.id)}
            disabled={loading}
          >
            {loading ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog แก้ไขข้อมูลผู้ใช้ */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">แก้ไขข้อมูลผู้ใช้</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {editError}
            </Alert>
          )}
          
          {editSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              อัปเดตข้อมูลเรียบร้อยแล้ว
            </Alert>
          )}
          
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 , py: 4 }}>
            <TextField
              label="ชื่อ"
              name="firstName"
              value={editFormData.firstName}
              onChange={handleEditFormChange}
              fullWidth
              required
              disabled={editLoading}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="นามสกุล"
              name="lastName"
              value={editFormData.lastName}
              onChange={handleEditFormChange}
              fullWidth
              required
              disabled={editLoading}
              variant="outlined"
            />
            
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                สิทธิ์และการยืนยัน
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editFormData.isAdmin === 'true'}
                      onChange={(e) => 
                        setEditFormData({
                          ...editFormData,
                          isAdmin: e.target.checked ? 'true' : 'false'
                        })
                      }
                      disabled={editLoading}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettingsIcon fontSize="small" color={editFormData.isAdmin === 'true' ? 'primary' : 'disabled'} />
                      <Typography>สิทธิ์แอดมิน</Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      name="emailVerified"
                      checked={editFormData.emailVerified}
                      onChange={handleEditFormChange}
                      disabled={editLoading}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={editFormData.emailVerified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"} 
                        color={editFormData.emailVerified ? "success" : "error"}
                        size="small"
                      />
                      <Typography>ยืนยันอีเมล</Typography>
                    </Box>
                  }
                />
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleEditDialogClose} 
            disabled={editLoading}
            variant="outlined"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleEditSubmit}
            color="primary"
            variant="contained"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : null}
          >
            {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 