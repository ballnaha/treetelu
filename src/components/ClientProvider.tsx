"use client";

import { ReactNode, useState, useEffect } from 'react';
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import dynamic from 'next/dynamic';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import { theme, createEmotionCache } from '@/theme/theme';
import CssBaseline from '@mui/material/CssBaseline';

// ใช้ dynamic import เพื่อแก้ปัญหา useCart และแยก MUI components ออกไปเพื่อป้องกัน hydration mismatch
const LayoutProviderClient = dynamic(
  () => import('./LayoutProvider'),
  { ssr: false }
);

// Dynamic import สำหรับ MaterialUI ที่ต้องการป้องกัน hydration errors
const DynamicCssBaseline = dynamic(() => Promise.resolve(CssBaseline), { ssr: false });

// สร้าง clientSideEmotionCache สำหรับการใช้งานบน client
const clientSideEmotionCache = createEmotionCache();

interface ClientProviderProps {
  children: ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // หลังการโหลดหน้าเว็บเสร็จสิ้น ให้ล้าง global styles ที่ซ้ำซ้อน
    const handleComplete = () => {
      // ล้าง duplicate emotion styles
      if (typeof window !== 'undefined') {
        const styles = document.querySelectorAll('style[data-emotion]');
        const emotionKeys = new Map();
        
        styles.forEach((style) => {
          const key = style.getAttribute('data-emotion');
          if (key) {
            if (emotionKeys.has(key)) {
              style.remove();
            } else {
              emotionKeys.set(key, true);
            }
          }
        });
      }
      
      setIsClient(true);
    };

    // เรียกใช้ทันที
    handleComplete();
    
    return () => {
      // Cleanup ถ้าจำเป็น
    };
  }, []);

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        {/* ห่อหุ้ม CssBaseline ไว้ในส่วนที่รันเฉพาะ client */}
        {isClient && <DynamicCssBaseline />}
        <AuthProvider>
          <CartProvider>
            {isClient ? (
              <LayoutProviderClient>
                {children}
              </LayoutProviderClient>
            ) : (
              // ใช้ suppressHydrationWarning={true} และสร้าง wrapper ธรรมดาที่ไม่ใช้ Material UI
              <div 
                suppressHydrationWarning={true}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  minHeight: '100vh' 
                }}
              >
                {children}
              </div>
            )}
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
} 