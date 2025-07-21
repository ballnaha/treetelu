"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { isInLiff } from "@/utils/liffUtils";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";

interface LiffAutoLoginProps {
  liffId?: string;
  children: React.ReactNode;
}

declare global {
  interface Window {
    liff: any;
    __LIFF_INITIALIZED__?: boolean;
  }
}

export default function LiffAutoLogin({
  liffId,
  children,
}: LiffAutoLoginProps) {
  const { user, login } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiffEnvironment, setIsLiffEnvironment] = useState(false);
  const hasInitialized = useRef(false);
  const isProcessing = useRef(false);

  // Function to perform auto login when user is already logged in to LIFF
  const performAutoLogin = useCallback(async () => {
    if (isProcessing.current) {
      console.log("Auto login already in progress");
      return;
    }

    try {
      isProcessing.current = true;
      console.log("Starting LIFF auto login...");

      // Check if LIFF SDK is available and initialized
      if (typeof window === 'undefined' || !window.liff) {
        throw new Error("LIFF SDK is not available");
      }
      
      if (typeof window.liff.getProfile !== 'function' || typeof window.liff.isLoggedIn !== 'function') {
        throw new Error("LIFF is not properly initialized");
      }
      
      // Check if user is logged in to LIFF
      if (!window.liff.isLoggedIn()) {
        throw new Error("User is not logged in to LIFF");
      }
      
      // Get profile and access token
      const profile = await window.liff.getProfile();
      const accessToken = window.liff.getAccessToken();
      
      if (!profile || !profile.userId) {
        throw new Error("Failed to get LIFF profile");
      }

      console.log("LIFF Profile obtained:", { userId: profile.userId, displayName: profile.displayName });

      // Send data to backend to create or update user
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

      // Update login state in AuthContext
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
      
      // Mark auto login as successful
      sessionStorage.setItem('liff_auto_login_success', 'true');
      localStorage.setItem('liff_last_login', Date.now().toString());
      
    } catch (error) {
      console.error("Auto login failed:", error);
      sessionStorage.setItem('liff_auto_login_failed', 'true');
      throw error;
    } finally {
      isProcessing.current = false;
    }
  }, [login]);

  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitialized.current || (typeof window !== 'undefined' && window.__LIFF_INITIALIZED__ === true)) {
      console.log("LIFF already initialized, skipping");
      return;
    }

    // Skip if user is already logged in
    if (user?.isLoggedIn) {
      console.log("User already logged in, skipping LIFF auto-login");
      hasInitialized.current = true;
      return;
    }

    const initializeLiff = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Get LIFF ID
        const currentLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID;
        if (!currentLiffId?.trim()) {
          console.log("No LIFF ID provided, skipping LIFF initialization");
          hasInitialized.current = true;
          return;
        }

        console.log("Starting LIFF initialization...");

        // Check if we're in a LIFF environment first
        const isFromLiff = isInLiff();
        setIsLiffEnvironment(isFromLiff);

        if (!isFromLiff) {
          console.log("Not in LIFF environment, skipping auto-login");
          hasInitialized.current = true;
          return;
        }

        // Check if auto-login was already attempted recently
        const lastLogin = localStorage.getItem('liff_last_login');
        const loginFailed = sessionStorage.getItem('liff_auto_login_failed');
        const loginSuccess = sessionStorage.getItem('liff_auto_login_success');
        
        if (loginSuccess) {
          console.log("Auto login already completed successfully in this session");
          hasInitialized.current = true;
          return;
        }

        if (loginFailed) {
          console.log("Auto login failed in this session, skipping");
          hasInitialized.current = true;
          return;
        }

        // Skip if login was attempted recently (within 5 minutes)
        if (lastLogin && (Date.now() - parseInt(lastLogin)) < 5 * 60 * 1000) {
          console.log("Auto login attempted recently, skipping");
          hasInitialized.current = true;
          return;
        }

        // Load LIFF SDK
        await loadLiffSDK();

        // Initialize LIFF
        if (!window.liff) {
          throw new Error("LIFF SDK not loaded");
        }

        if (typeof window.liff.init !== 'function') {
          console.log("LIFF already initialized");
        } else {
          await window.liff.init({ liffId: currentLiffId });
          console.log("LIFF initialized successfully");
        }

        // Check if we're in LINE app
        const isInLineApp = typeof window.liff.isInClient === 'function' && window.liff.isInClient();
        console.log("Is in LINE app:", isInLineApp);

        // Handle auto-login based on environment
        if (isInLineApp) {
          // In LINE app - check if logged in and perform auto-login
          if (typeof window.liff.isLoggedIn === 'function' && window.liff.isLoggedIn()) {
            console.log("User logged in to LIFF, performing auto-login");
            await performAutoLogin();
          } else {
            console.log("User not logged in to LIFF, initiating login");
            window.liff.login();
            return;
          }
        } else {
          // In external browser - check if LIFF login is available
          if (typeof window.liff.isLoggedIn === 'function' && window.liff.isLoggedIn()) {
            console.log("LIFF login available in external browser, performing auto-login");
            await performAutoLogin();
          } else {
            console.log("LIFF login not available in external browser");
          }
        }

        hasInitialized.current = true;
        if (typeof window !== 'undefined') {
          window.__LIFF_INITIALIZED__ = true;
        }
      } catch (error) {
        console.error("LIFF initialization error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ"
        );
        hasInitialized.current = true;
        if (typeof window !== 'undefined') {
          window.__LIFF_INITIALIZED__ = true;
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeLiff();
  }, [user?.isLoggedIn, liffId, performAutoLogin]);

  // Helper function to load LIFF SDK
  const loadLiffSDK = useCallback(async () => {
    if (typeof window !== 'undefined' && window.liff) {
      return; // Already loaded
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
      document.head.appendChild(script);
    });
  }, []);

  // Show loading state only when initializing in LIFF environment
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

  // Show error with option to dismiss
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
