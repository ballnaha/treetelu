'use client';

import { useState } from 'react';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'ส่งอีเมลทดสอบสำเร็จแล้ว กรุณาตรวจสอบอีเมลของคุณ',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'เกิดข้อผิดพลาดในการส่งอีเมล',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการส่งอีเมล',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        p: 3,
      }}
    >
      <Typography variant="h5" gutterBottom>
        ทดสอบการส่งอีเมล
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="อีเมล"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'กำลังส่ง...' : 'ส่งอีเมลทดสอบ'}
        </Button>
      </form>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mt: 2 }}
        >
          {message.text}
        </Alert>
      )}
    </Box>
  );
} 