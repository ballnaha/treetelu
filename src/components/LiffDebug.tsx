"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
} from "@mui/material";

interface DebugInfo {
  timestamp?: string;
  userAgent?: string;
  hostname?: string;
  href?: string;
  referrer?: string;
  liffSDKLoaded?: boolean;
  liffReady?: boolean;
  liffInClient?: boolean;
  liffLoggedIn?: boolean;
  liffOS?: string;
  liffLanguage?: string;
  liffVersion?: string;
  liffError?: string;
  initError?: string;
  profile?: any;
  profileError?: string;
}

export default function LiffDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLiffStatus();
  }, []);

  const checkLiffStatus = () => {
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      href: window.location.href,
      referrer: document.referrer,
      liffSDKLoaded: typeof window.liff !== "undefined",
    };

    if (typeof window.liff !== "undefined") {
      try {
        info.liffReady = window.liff.isReady?.() || false;
        info.liffInClient = window.liff.isInClient?.() || false;
        info.liffLoggedIn = window.liff.isLoggedIn?.() || false;
        info.liffOS = window.liff.getOS?.() || "unknown";
        info.liffLanguage = window.liff.getLanguage?.() || "unknown";
        info.liffVersion = window.liff.getVersion?.() || "unknown";
      } catch (error) {
        info.liffError = String(error);
      }
    }

    setDebugInfo(info);
  };

  const loadLiffSDK = async () => {
    setLoading(true);
    try {
      if (typeof window.liff === "undefined") {
        const script = document.createElement("script");
        script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
        script.async = true;

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      checkLiffStatus();
    } catch (error) {
      console.error("Failed to load LIFF SDK:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeLiff = async () => {
    setLoading(true);
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        throw new Error("LIFF ID not found in environment variables");
      }

      await window.liff.init({ liffId });
      checkLiffStatus();
    } catch (error) {
      console.error("LIFF initialization failed:", error);
      setDebugInfo((prev) => ({ ...prev, initError: String(error) }));
    } finally {
      setLoading(false);
    }
  };

  const loginWithLiff = () => {
    try {
      if (window.liff && window.liff.isReady()) {
        window.liff.login();
      } else {
        throw new Error("LIFF not ready");
      }
    } catch (error) {
      console.error("LIFF login failed:", error);
    }
  };

  const getProfile = async () => {
    setLoading(true);
    try {
      if (window.liff && window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        setDebugInfo((prev) => ({ ...prev, profile }));
      } else {
        throw new Error("Not logged in to LIFF");
      }
    } catch (error) {
      console.error("Failed to get profile:", error);
      setDebugInfo((prev) => ({ ...prev, profileError: String(error) }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          LIFF Debug Tool
        </Typography>

        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={checkLiffStatus} size="small">
            Refresh Status
          </Button>
          <Button
            variant="outlined"
            onClick={loadLiffSDK}
            disabled={loading}
            size="small"
          >
            Load LIFF SDK
          </Button>
          <Button
            variant="outlined"
            onClick={initializeLiff}
            disabled={loading || !debugInfo.liffSDKLoaded}
            size="small"
          >
            Initialize LIFF
          </Button>
          <Button
            variant="outlined"
            onClick={loginWithLiff}
            disabled={!debugInfo.liffReady}
            size="small"
          >
            Login
          </Button>
          <Button
            variant="outlined"
            onClick={getProfile}
            disabled={loading || !debugInfo.liffLoggedIn}
            size="small"
          >
            Get Profile
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          LIFF ID: {process.env.NEXT_PUBLIC_LIFF_ID || "Not set"}
        </Alert>

        <Box
          sx={{
            backgroundColor: "#f5f5f5",
            p: 2,
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            overflow: "auto",
            maxHeight: "400px",
          }}
        >
          {JSON.stringify(debugInfo, null, 2)}
        </Box>
      </CardContent>
    </Card>
  );
}
