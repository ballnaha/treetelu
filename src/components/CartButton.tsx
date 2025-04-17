"use client";

import { Badge, IconButton, styled, SxProps, Theme } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
  sx?: SxProps<Theme>;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  color: theme.palette.text.primary,
  padding: theme.spacing(1),
  transition: 'color 0.3s ease',
  '&:hover': {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    fontWeight: 'medium',
    minWidth: 20,
    height: 20,
  },
}));

export default function CartButton({ itemCount, onClick, sx }: CartButtonProps) {
  return (
    <StyledIconButton
      onClick={onClick}
      aria-label="เปิดตะกร้าสินค้า"
      sx={sx}
    >
      <StyledBadge 
        badgeContent={itemCount} 
        color="primary"
        invisible={itemCount <= 0}
        max={99}
      >
        <ShoppingCartIcon />
      </StyledBadge>
    </StyledIconButton>
  );
} 