"use client";

import React from 'react';
import { Box, Typography, Alert, LinearProgress } from '@mui/material';
import { useShippingSettings } from '@/hooks/useShippingSettings';

interface ShippingInfoProps {
  subtotal: number;
  showProgress?: boolean;
  variant?: 'default' | 'compact';
}

export default function ShippingInfo({ 
  subtotal, 
  showProgress = true, 
  variant = 'default' 
}: ShippingInfoProps) {
  const { 
    settings, 
    loading, 
    calculateShippingCost, 
    isEligibleForFreeShipping, 
    getAmountNeededForFreeShipping 
  } = useShippingSettings();

  if (loading) {
    return null; // หรือแสดง skeleton loading
  }

  const shippingCost = calculateShippingCost(subtotal);
  const isFreeShipping = isEligibleForFreeShipping(subtotal);
  const amountNeeded = getAmountNeededForFreeShipping(subtotal);
  const progressPercentage = Math.min((subtotal / settings.freeShippingMinAmount) * 100, 100);

  if (variant === 'compact') {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          ค่าจัดส่ง: {isFreeShipping ? 'ฟรี' : `฿${shippingCost.toLocaleString()}`}
        </Typography>
        {!isFreeShipping && (
          <Typography variant="caption" color="text.secondary">
            ซื้อเพิ่ม ฿{amountNeeded.toLocaleString()} เพื่อฟรีค่าจัดส่ง
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {isFreeShipping ? (
        <Alert severity="success" sx={{ mb: 2 }} icon={false}>
          <Typography variant="body2" fontWeight={500}>
            🎉 คุณได้รับฟรีค่าจัดส่งแล้ว!
          </Typography>
        </Alert>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }} icon={false}>
            <Typography variant="body2">
              ซื้อเพิ่ม <strong>฿{amountNeeded.toLocaleString()}</strong> เพื่อรับฟรีค่าจัดส่ง
            </Typography>
          </Alert>
          
          {showProgress && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  ความคืบหน้าสู่ฟรีค่าจัดส่ง
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progressPercentage.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: progressPercentage >= 100 ? 'success.main' : 'primary.main'
                  }
                }} 
              />
            </Box>
          )}
        </Box>
      )}
      
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          ข้อมูลค่าจัดส่ง
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • ค่าจัดส่ง ฿{settings.standardShippingCost.toLocaleString()} สำหรับการสั่งซื้อต่ำกว่า ฿{settings.freeShippingMinAmount.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>ฟรีค่าจัดส่ง</strong> เมื่อสั่งซื้อตั้งแต่ ฿{settings.freeShippingMinAmount.toLocaleString()} ขึ้นไป
        </Typography>
      </Box>
    </Box>
  );
}