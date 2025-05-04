'use client';

import { Container, Typography } from '@mui/material';
import React from 'react';
import dynamic from 'next/dynamic';

// ใช้ dynamic import เพื่อไม่ให้ component render ฝั่ง server
// เนื่องจากมีการเรียกใช้ API ที่ทำงานเฉพาะฝั่ง client
const DiscountCodesClient = dynamic(
  () => import('./client'),
  { ssr: false }
);

export default function DiscountCodesPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        จัดการรหัสส่วนลด
      </Typography>
      <DiscountCodesClient />
    </Container>
  );
}