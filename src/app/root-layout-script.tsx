"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RootLayoutScript() {
  const { login } = useAuth();

  useEffect(() => {
    // ฟังก์ชันสำหรับตรวจสอบและอ่านค่าจาก cookie
    function getCookie(name: string): string | null {
      if (typeof document === 'undefined') return null;
      
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return null;
    }
    
    // อ่านค่า user_data จาก cookie
    const userDataCookie = getCookie('user_data');
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie);
        // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
        if (userData && userData.id && userData.isLoggedIn) {
          // เก็บข้อมูลลงใน localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          // อัปเดตสถานะการล็อกอิน
          login(userData);
          
          // ล้าง cookie หลังจากใช้งานแล้ว
          document.cookie = 'user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // แจ้งเตือนระบบว่ามีการเปลี่ยนแปลงข้อมูลผู้ใช้
          const loginStateChangeEvent = new Event('loginStateChange');
          window.dispatchEvent(loginStateChangeEvent);
        }
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
      }
    }
  }, [login]);

  // Component นี้ไม่แสดงผลอะไร เป็นแค่การทำงานใน background
  return null;
} 