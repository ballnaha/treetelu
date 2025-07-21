"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { isInLiff } from "@/utils/liffUtils";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";

// Debug flag for showing more detailed logs
const DEBUG = true;

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

  // Helper function to load LIFF SDK
  const loadLiffSDK = useCallback(async () => {
    if (DEBUG) console.log("[LIFF] Attempting to load LIFF SDK");
    
    // Check if LIFF is already loaded
    if (typeof window !== 'undefined' && window.liff) {
      if (DEBUG) console.log("[LIFF] SDK already loaded in window object");
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        if (DEBUG) console.log("[LIFF] Creating script tag");
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          if (DEBUG) console.log("[LIFF] SDK script loaded successfully");
          // Verify liff object exists
          if (typeof window.liff === 'undefined') {
            const errMsg = "LIFF object not found after script load";
            console.error(errMsg);
            reject(new Error(errMsg));
            return;
          }
          resolve();
        };
        
        script.onerror = (error) => {
          const errMsg = "Failed to load LIFF SDK";
          console.error(errMsg, error);
          reject(new Error(errMsg));
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error("[LIFF] Error while loading SDK:", err);
        reject(err);
      }
    });
  }, []);

  useEffect(() => {
    if (DEBUG) console.log('[LIFF] Component mounted, starting initialization');
    
    // Prevent duplicate initialization
    if (hasInitialized.current || (typeof window !== 'undefined' && window.__LIFF_INITIALIZED__ === true)) {
      if (DEBUG) console.log("[LIFF] Already initialized, skipping");
      return;
    }

    // Skip if user is already logged in
    if (user?.isLoggedIn) {
      if (DEBUG) console.log("[LIFF] User already logged in, skipping auto-login");
      hasInitialized.current = true;
      return;
    }
    
    // Log environment info for debugging
    if (DEBUG) console.log('[LIFF] Environment info:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'undefined',
      url: typeof window !== 'undefined' ? window.location.href : 'undefined',
      referrer: typeof document !== 'undefined' ? document.referrer.substring(0, 100) : 'undefined',
      liffId: liffId || process.env.NEXT_PUBLIC_LIFF_ID || 'not defined'
    });
    
    // Force clear any previous session flags to ensure we try login again
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('liff_auto_login_failed');
      sessionStorage.removeItem('liff_auto_login_success');
    }

    const initializeLiff = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Get LIFF ID
        const currentLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID;
        if (!currentLiffId?.trim()) {
          if (DEBUG) console.log("[LIFF] No LIFF ID provided, skipping initialization");
          hasInitialized.current = true;
          return;
        }

        if (DEBUG) console.log("[LIFF] Starting initialization with ID:", currentLiffId);

        // Check if we're in a LIFF environment first
        const isFromLiff = isInLiff();
        if (DEBUG) console.log("[LIFF] Is in LIFF environment:", isFromLiff);
        setIsLiffEnvironment(isFromLiff);

        // Force LIFF environment for testing in development (remove in production)
        if (process.env.NODE_ENV === 'development') {
          // Comment this line out to test non-LIFF behavior
          // sessionStorage.setItem('line_liff_session', 'true');
        }

        if (!isFromLiff) {
          if (DEBUG) console.log("[LIFF] Not in LIFF environment, skipping auto-login");
          hasInitialized.current = true;
          return;
        }

        // Check if auto-login was already attempted recently
        // Note: We're skipping this check because we cleared the flags above to force a login attempt
        // This is just to show the original logic
        const lastLogin = localStorage.getItem('liff_last_login');
        const loginFailed = sessionStorage.getItem('liff_auto_login_failed');
        const loginSuccess = sessionStorage.getItem('liff_auto_login_success');
        
        if (loginSuccess) {
          if (DEBUG) console.log("[LIFF] Auto login already completed successfully in this session");
          // We're not returning early anymore to force another login attempt
          // hasInitialized.current = true;
          // return;
        }

        if (loginFailed) {
          if (DEBUG) console.log("[LIFF] Auto login failed in this session, attempting again");
          // We're not returning early anymore to force another login attempt
          // hasInitialized.current = true;
          // return;
        }

        // Skip if login was attempted recently (within 5 minutes)
        // We're reducing this to 1 minute for testing purposes
        if (lastLogin && (Date.now() - parseInt(lastLogin)) < 1 * 60 * 1000) {
          if (DEBUG) console.log("[LIFF] Auto login attempted recently, will try again in a minute");
          // We're not returning early anymore to force another login attempt
          // hasInitialized.current = true;
          // return;
        }

        // Load LIFF SDK
        if (DEBUG) console.log("[LIFF] Loading SDK...");
        await loadLiffSDK();

        // Initialize LIFF
        if (!window.liff) {
          const errMsg = "[LIFF] SDK not loaded after loadLiffSDK call";
          console.error(errMsg);
          throw new Error(errMsg);
        }

        if (typeof window.liff.init !== 'function') {
          if (DEBUG) console.log("[LIFF] Already initialized (init function not available)");
        } else {
          if (DEBUG) console.log("[LIFF] Initializing with ID:", currentLiffId);
          try {
            await window.liff.init({ liffId: currentLiffId });
            if (DEBUG) console.log("[LIFF] Initialized successfully");
          } catch (initError) {
            console.error("[LIFF] Initialization failed:", initError);
            throw initError;
          }
        }
        
        // Verify LIFF is properly initialized by checking core functions
        if (!window.liff.isInClient || !window.liff.isLoggedIn || !window.liff.getProfile) {
          console.error("[LIFF] SDK initialized but missing expected functions");
          if (DEBUG) console.log("[LIFF] Available functions:", Object.keys(window.liff).join(', '));
          
          // Add extra validation - throwing error if critical functions are missing
          if (!window.liff.isLoggedIn || !window.liff.getProfile) {
            throw new Error("LIFF SDK missing critical functions for auto-login");
          }
        }

        // Check if we're in LINE app
        const isInLineApp = typeof window.liff.isInClient === 'function' && window.liff.isInClient();
        if (DEBUG) console.log("[LIFF] Is in LINE app:", isInLineApp);

        // Force logged in status for testing (REMOVE IN PRODUCTION)
        // window.liff._mock = { isLoggedIn: true };
        // const originalIsLoggedIn = window.liff.isLoggedIn;
        // window.liff.isLoggedIn = () => window.liff._mock.isLoggedIn;
        
        // Handle auto-login based on environment
        if (isInLineApp) {
          // In LINE app - check if logged in and perform auto-login
          if (typeof window.liff.isLoggedIn === 'function' && window.liff.isLoggedIn()) {
            if (DEBUG) console.log("[LIFF] User logged in, performing auto-login");
            try {
              await performAutoLogin();
              if (DEBUG) console.log("[LIFF] Auto-login successful in LINE app");
            } catch (loginError) {
              console.error("[LIFF] Auto-login failed in LINE app:", loginError);
              setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง");
            }
          } else {
            if (DEBUG) console.log("[LIFF] User not logged in, initiating login");
            try {
              window.liff.login();
              if (DEBUG) console.log("[LIFF] Login initiated");
              return;
            } catch (loginError) {
              console.error("[LIFF] Login failed:", loginError);
              setError("ไม่สามารถเข้าสู่ระบบได้ โปรดลองอีกครั้งภายหลัง");
            }
          }
        } else {
          // In external browser - check if LIFF login is available
          if (typeof window.liff.isLoggedIn === 'function' && window.liff.isLoggedIn()) {
            if (DEBUG) console.log("[LIFF] Login available in external browser, performing auto-login");
            try {
              await performAutoLogin();
              if (DEBUG) console.log("[LIFF] Auto-login successful in external browser");
            } catch (loginError) {
              console.error("[LIFF] Auto-login failed in external browser:", loginError);
              setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง");
            }
          } else {
            if (DEBUG) console.log("[LIFF] Login not available in external browser");
          }
        }

        hasInitialized.current = true;
        if (typeof window !== 'undefined') {
          window.__LIFF_INITIALIZED__ = true;
        }
      } catch (error) {
        console.error("[LIFF] Initialization error:", error);
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

    // Start the initialization process
    initializeLiff();
  }, [user?.isLoggedIn, liffId, performAutoLogin, loadLiffSDK]);
  return (
    <>
      {isInitializing && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 9999,
            textAlign: "center",
            padding: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            กำลังตรวจสอบการเข้าสู่ระบบ...
          </Typography>
        </Box>
      )}
      {error && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 9999,
            padding: "8px",
          }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}
      {/* Development debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box 
          sx={{
            position: "fixed",
            bottom: 0,
            right: 0,
            zIndex: 9999,
            padding: "4px",
            fontSize: "10px",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            maxWidth: "300px",
          }}
        >
          LIFF: {isLiffEnvironment ? 'Yes' : 'No'} | 
          Init: {hasInitialized.current ? 'Yes' : 'No'} | 
          User: {user?.isLoggedIn ? 'Yes' : 'No'}
        </Box>
      )}
      {children}
    </>
  );
}

