'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * คอมโพเนนต์ที่ติดตาม API request สำหรับทำ auto logout เมื่อพบข้อผิดพลาด 401
 * ใส่คอมโพเนนต์นี้ไว้ใน layout เพื่อให้ทำงานในทุกหน้า
 */
export default function AuthStatusChecker() {
  const { logout, user, showAuthErrorSnackbar } = useAuth();
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    // ฟังก์ชันเพื่อดักจับ API request
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      try {
        // เรียกใช้งาน fetch ดั้งเดิม
        const response = await originalFetch(input, init);
        
        // ตรวจสอบข้อผิดพลาด 401 (Unauthorized)
        if (response.status === 401) {
          console.log('Authentication failed (401): Auto logout triggered');
          
          // ป้องกันการวนลูปและไม่ให้เกิดความสับสนกับหน้า login
          if (typeof input === 'string' && 
              !input.includes('/api/auth/logout') && 
              !input.includes('/api/auth/login')) {
            
            // แสดง Snackbar แจ้งเตือน - ใช้ข้อความสั้นและชัดเจน
            showAuthErrorSnackbar("กรุณาเข้าสู่ระบบใหม่", "session_expired");
            
            // หน่วงเวลาก่อนทำ logout
            setTimeout(() => {
              // ส่ง parameter เป็น empty string เพื่อไม่ให้มีข้อความที่ทำให้เกิดการปนกัน
              // แต่ยังคงส่ง error_type ที่ชัดเจนไปด้วย
              logout("", "session_expired");
            }, 1500);
          }
        }
        
        // ส่งคืนค่าผลลัพธ์ดั้งเดิม
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        // ส่งคืนข้อผิดพลาดเพื่อให้ส่วนอื่นสามารถจัดการได้
        throw error;
      }
    };
    
    // คืนค่าฟังก์ชันดั้งเดิมเมื่อคอมโพเนนต์ถูกลบ
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout, isAdmin, showAuthErrorSnackbar]);

  // ไม่ต้องแสดง Snackbar ในคอมโพเนนต์นี้อีกต่อไป เพราะจะจัดการโดย AuthContext
  return null;
} 