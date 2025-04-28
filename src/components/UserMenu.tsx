"use client";

import React, { useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Button, Divider, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: '8px 16px',
  borderRadius: '20px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
    backgroundColor: theme.palette.primary.dark,
  },
}));


export default function UserMenu() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  
  //console.log('UserMenu: user from AuthContext:', user);
  
  // state สำหรับ menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  
  const handleLogout = async () => {
    try {
      // ปิดเมนูก่อนที่จะล็อกเอาท์
      handleClose();
      // เรียกใช้ logout จาก AuthContext
      await logout();
      // นำทางไปยังหน้า login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // แม้มีข้อผิดพลาด ยังคงพยายามนำทางไปยังหน้า login
      router.push('/login');
    }
  };

  // แสดง loading indicator หรือไม่แสดงอะไรเลยระหว่างโหลดข้อมูล
  if (isLoading) {
    return null;
  }

  if (!user?.isLoggedIn) {
    return (
      <>
        <IconButton
          onClick={handleClick}
          size="medium"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            color: 'text.primary',
            '&:hover': {
              color: 'primary.main',
            }
          }}
        >
          <AccountCircleIcon />
        </IconButton>
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'account-button',
          }}
        >
          <MenuItem onClick={() => {router.push('/register'); handleClose();}}>สมัครสมาชิก</MenuItem>
          <MenuItem onClick={() => {router.push('/login'); handleClose();}}>เข้าสู่ระบบ</MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        onClick={handleClick}
        size="medium"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          color: 'text.primary',
          '&:hover': {
            color: 'primary.main',
          }
        }}
      >
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'account-button',
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'inherit',
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            สวัสดี, {user.name}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => {router.push('/profile'); handleClose();}}>โปรไฟล์</MenuItem>
        <MenuItem onClick={() => {router.push('/order-history'); handleClose();}}>ประวัติการสั่งซื้อ</MenuItem>
        
        {/* เมนูพิเศษสำหรับผู้ดูแลระบบ - แสดงตลอดเวลาสำหรับการทดสอบ */}
        {user.isAdmin && <Divider />}
        
        {user.isAdmin && (
          <MenuItem 
            onClick={() => {router.push('/admin/products'); handleClose();}}
            sx={{ color: 'primary.main' }}
          >
            <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
            จัดการสินค้า
          </MenuItem>
        )}
        
        {user.isAdmin && (
          <MenuItem 
            onClick={() => {router.push('/admin/orders'); handleClose();}}
            sx={{ color: 'primary.main' }}
          >
            <ShoppingBagIcon fontSize="small" sx={{ mr: 1 }} />
            ตรวจสอบการสั่งซื้อ
          </MenuItem>
        )}
        
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          ออกจากระบบ
        </MenuItem>
      </Menu>
    </Box>
  );
}
