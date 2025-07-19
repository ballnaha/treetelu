"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  initializeLiff,
  isLiffLoggedIn,
  getLiffProfile,
  getLiffAccessToken,
  liffLogin,
} from "@/utils/liffUtils";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";

interface LiffAutoLoginProps {
  liffId?: string;
  children: React.ReactNode;
}

export default function LiffAutoLogin({
  liffId,
  children,
}: LiffAutoLoginProps) {
  const { user, login } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiffEnvironment, setIsLiffEnvironment] = useState(false);

  useEffect(() => {
    const checkAndAutoLogin = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // โหลด LIFF SDK ก่อนเสมอ
        if (typeof window !== "undefined" && !window.liff) {
          console.log("Loading LIFF SDK...");
          await loadLiffSDK();
        }

        // ใช้ LIFF ID จาก environment variable ถ้าไม่มีการส่งมา
        const currentLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID;

        if (!currentLiffId) {
          console.log("No LIFF ID provided, skipping LIFF initialization");
          return;
        }

        // เริ่มต้น LIFF
        if (window.liff) {
          console.log("Initializing LIFF with ID:", currentLiffId);
          const initialized = await initializeLiff(currentLiffId);
          if (!initialized) {
            throw new Error("Failed to initialize LIFF");
          }

          // ตรวจสอบว่าอยู่ใน LIFF environment หรือไม่
          const inLiff = window.liff.isInClient();
          setIsLiffEnvironment(inLiff);
          console.log("LIFF environment check:", inLiff);

          // ถ้าผู้ใช้ล็อกอินแล้ว ไม่ต้องทำอะไร
          if (user?.isLoggedIn) {
            console.log("User already logged in, skipping LIFF auto login");
            return;
          }

          // ตรวจสอบสถานะการล็อกอินใน LIFF
          if (isLiffLoggedIn()) {
            console.log("User is logged in to LIFF, attempting auto login");
            await performAutoLogin();
          } else {
            console.log("User not logged in to LIFF");
            // ถ้าอยู่ใน LIFF แต่ยังไม่ล็อกอิน ให้ redirect ไปหน้า login
            if (inLiff) {
              console.log("In LIFF but not logged in, redirecting to login");
              liffLogin();
            }
          }
        }
      } catch (error) {
        console.error("LIFF auto login error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ"
        );
      } finally {
        setIsInitializing(false);
      }
    };

    checkAndAutoLogin();
  }, [user?.isLoggedIn, liffId, login]);

  const loadLiffSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && window.liff) {
        console.log("LIFF SDK already loaded");
        resolve();
        return;
      }

      console.log("Loading LIFF SDK from CDN...");
      const script = document.createElement("script");
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.async = true;
      script.onload = () => {
        console.log("LIFF SDK loaded successfully");
        resolve();
      };
      script.onerror = (error) => {
        console.error("Failed to load LIFF SDK:", error);
        reject(new Error("Failed to load LIFF SDK"));
      };
      document.head.appendChild(script);
    });
  };

  const performAutoLogin = async () => {
    try {
      // ดึงข้อมูลโปรไฟล์จาก LIFF
      const profile = await getLiffProfile();
      const accessToken = getLiffAccessToken();

      if (!profile) {
        throw new Error("Failed to get LIFF profile");
      }

      console.log("LIFF Profile:", profile);

      // ส่งข้อมูลไปยัง backend เพื่อสร้างหรืออัปเดตผู้ใช้
      const response = await fetch("/api/auth/liff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const userData = await response.json();

      // อัปเดตสถานะการล็อกอินใน AuthContext
      login(
        {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          isLoggedIn: true,
          isAdmin: userData.isAdmin || false,
          isLineUser: true,
          token: userData.token,
          avatar: userData.avatar || profile.pictureUrl || "",
        },
        userData.csrfToken
      );

      console.log("LIFF auto login successful");
    } catch (error) {
      console.error("Auto login failed:", error);
      throw error;
    }
  };

  // แสดง loading หรือ error ถ้าจำเป็น
  if (isLiffEnvironment && isInitializing) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          กำลังเข้าสู่ระบบอัตโนมัติ...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity="warning" onClose={() => setError(null)}>
          {error}
        </Alert>
        {children}
      </Box>
    );
  }

  return <>{children}</>;
}
