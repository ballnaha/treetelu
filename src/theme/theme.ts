import { createTheme } from '@mui/material/styles';
import createCache, { EmotionCache } from '@emotion/cache';

// ปรับปรุง createEmotionCache เพื่อป้องกัน hydration errors
export const createEmotionCache = (): EmotionCache => {
  // สร้าง insertion point ที่ถูกกำหนดใน meta tag
  let insertionPoint;
  
  if (typeof document !== 'undefined') {
    // Client-side: ใช้ meta tag ที่กำหนดไว้
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }
  
  return createCache({ 
    key: 'mui-style',
    insertionPoint, 
    prepend: true,
    // ตั้งค่า speedy: false เพื่อทำให้ style tags อ่านง่ายขึ้นในการพัฒนา
    // สามารถตั้งค่าเป็น true ในโหมด production เพื่อประสิทธิภาพที่ดีขึ้น
    speedy: false
  });
};

// สร้างธีมสำหรับ MUI
export const theme = createTheme({
  palette: {
    primary: {
      main: "#24B493", // สีเขียวมิ้นท์
      dark: "#1D9679",
      light: "#4CC9AD",
    },
    secondary: {
      main: "#505C64", 
      light: "#8EACBC",
      dark: "#2A3B47",
    },
    text: {
      primary: "#2A3B47",
      secondary: "#505C64",
    },
    background: {
      default: "#FFFFFF",
      paper: "#F4F9F8",
    },
  },
  typography: {
    fontFamily: '"Prompt", "Inter", "sans-serif"',
    h1: { fontWeight: 700, letterSpacing: "-0.01em" },
    h2: { fontWeight: 600, letterSpacing: "-0.01em" },
    h3: { fontWeight: 500, letterSpacing: "-0.01em" },
    h4: {
      fontWeight: 400,
      letterSpacing: "-0.01em",
      fontSize: "1.8rem",
      color: "#333",
    },
    button: { textTransform: "none", fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.7, letterSpacing: "0.1em" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: "10px 24px", boxShadow: "none" },
        contained: { "&:hover": { boxShadow: "0px 4px 12px rgba(36, 180, 147, 0.2)" } },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 15px rgba(0, 0, 0, 0.05)",
          borderRadius: 12,
        }
      }
    },
    MuiPaper: { 
      styleOverrides: { 
        root: { borderRadius: 12 } 
      } 
    },
    MuiTab: { 
      styleOverrides: { 
        root: { textTransform: "none", fontWeight: 500 } 
      } 
    },
  },
}); 