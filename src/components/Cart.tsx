"use client";

import { useState } from 'react';
import { Product } from '@/types/product';
import Image from 'next/image';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  Button, 
  styled, 
  ButtonGroup,
  Paper,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';

export interface CartItem extends Product {
  quantity: number;
  image: string;
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CartDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '100%',
    maxWidth: 450,
    padding: 0,
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
    },
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  }
}));

const EmptyCartContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  textAlign: 'center',
}));

const CartItemImage = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 80,
  width: 80,
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const CompactButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  '& .MuiButton-root': {
    minWidth: '40px',
    width: '35px',
    height: '35px',
    padding: 0
  }
}));

export default function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onClose, isOpen }: CartProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(String(item.salesPrice || item.price || 0)) * item.quantity), 0);

  return (
    <CartDrawer anchor="right" open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ตะกร้าสินค้า {cartItems.length > 0 && `(${cartItems.length})`}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {cartItems.length === 0 ? (
          <EmptyCartContainer>
            <ShoppingCartIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              ตะกร้าของคุณว่างเปล่า
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              กรุณาเลือกสินค้าเพื่อเพิ่มลงในตะกร้า
            </Typography>
            <Button 
              variant="outlined" 
              onClick={onClose}
              size="large"
            >
              เลือกซื้อสินค้า
            </Button>
          </EmptyCartContainer>
        ) : (
          <>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <List disablePadding>
                {cartItems.map((item) => (
                  <ListItem 
                    key={item.id} 
                    sx={{ 
                      py: 2, 
                      px: 0, 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <CartItemImage>
                      <Image
                        src={item.image || '/images/product/placeholder.jpg'}
                        alt={item.productName || item.name || 'Product'}
                        fill
                        sizes="80px"
                        style={{ objectFit: 'cover' }}
                      />
                    </CartItemImage>
                    
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                        {item.productName || item.name || 'Product'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ฿{parseFloat(String(item.salesPrice || item.price || 0)).toLocaleString()}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CompactButtonGroup size="small" aria-label="quantity controls">
                          <Button 
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </Button>
                          <Button 
                            disableRipple 
                            disableFocusRipple 
                            sx={{ 
                              cursor: 'default', 
                              '&:hover': { bgcolor: 'white' },
                              fontWeight: 'normal',
                              fontSize: '0.8rem'
                            }}
                          >
                            {item.quantity}
                          </Button>
                          <Button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                            <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </Button>
                        </CompactButtonGroup>
                        
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => onRemoveItem(item.id)}
                          sx={{ ml: 1, color: 'error.main', padding: '4px' }}
                          size="small"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, pl: 1 }}>
                      ฿{(parseFloat(String(item.salesPrice || item.price || 0)) * item.quantity).toLocaleString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderTop: 1, 
                borderColor: 'divider', 
                backgroundColor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">ยอดรวม</Typography>
                <Typography variant="body1" fontWeight={500}>฿{subtotal.toLocaleString()}</Typography>
              </Box>
              
              {subtotal < 1500 ? (
                <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2">
                    สั่งซื้อเพิ่มอีก ฿{(1500 - subtotal).toLocaleString()} เพื่อรับสิทธิ์จัดส่งฟรี!
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    (ค่าจัดส่งปกติ 100 บาท)
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mt: 2 }} icon={false}>
                  <Typography variant="body2">
                    คุณได้รับสิทธิ์จัดส่งฟรี!
                  </Typography>
                </Alert>
              )}
              
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                component={Link}
                href="/checkout"
                onClick={onClose}
                sx={{ mb: 1 }}
              >
                ไปยังหน้าชำระเงิน
              </Button>
              
              <Button 
                variant="outlined" 
                fullWidth
                onClick={onClose}
              >
                เลือกซื้อสินค้าต่อ
              </Button>
            </Paper>
          </>
        )}
      </Box>
    </CartDrawer>
  );
} 