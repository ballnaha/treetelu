'use client';

import { Box, Typography } from '@mui/material';

interface LoadingAnimationProps {
  text?: string;
  fullHeight?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingAnimation({ 
  text = 'กำลังโหลด', 
  fullHeight = true,
  size = 'medium'
}: LoadingAnimationProps) {
  // กำหนดขนาดของ spinner ตาม prop
  const spinnerSizes = {
    small: {
      outer: 40,
      middle: 30,
      inner: 20,
      fontSize: '1rem',
      spacing: 12
    },
    medium: {
      outer: 60,
      middle: 46,
      inner: 30,
      fontSize: '1.25rem',
      spacing: 16
    },
    large: {
      outer: 80,
      middle: 62,
      inner: 40,
      fontSize: '1.5rem',
      spacing: 20
    }
  };

  const { outer, middle, inner, fontSize, spacing } = spinnerSizes[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullHeight ? '80vh' : 'auto',
        width: '100%',
        py: fullHeight ? 0 : 4
      }}
    >
      <Box sx={{ position: 'relative', width: outer, height: outer, mb: spacing / 8 }}>
        <Box
          sx={{
            position: 'absolute',
            width: outer,
            height: outer,
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#24B493',
            animation: 'spinner-outer 1.5s linear infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: middle,
            height: middle,
            top: (outer - middle) / 2,
            left: (outer - middle) / 2,
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#4CC9AD',
            animation: 'spinner-inner 1.2s linear infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: inner,
            height: inner,
            top: (outer - inner) / 2,
            left: (outer - inner) / 2,
            borderRadius: '50%',
            border: '4px solid transparent',
            borderTopColor: '#8EACBC',
            animation: 'spinner-outer 0.9s linear infinite',
          }}
        />
      </Box>

      {text && (
        <Typography
          variant={size === 'small' ? 'body2' : 'h6'}
          sx={{
            color: '#24B493',
            fontWeight: 500,
            fontSize,
            fontFamily: "'Prompt', sans-serif",
          }}
        >
          {text}
        </Typography>
      )}

      <style jsx global>{`
        @keyframes spinner-outer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spinner-inner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </Box>
  );
} 