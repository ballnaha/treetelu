/**
 * Utility functions for LINE LIFF integration
 */

declare global {
  interface Window {
    liff: any;
    __LIFF_INITIALIZED__?: boolean;
  }
}

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * ตรวจสอบว่าแอปกำลังทำงานใน LINE LIFF หรือไม่
 */
export const isInLiff = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // ตรวจสอบจาก User Agent
  const userAgent = navigator.userAgent;
  const isLineApp = userAgent.includes('Line/') || userAgent.includes('LINE/');
  
  // ตรวจสอบจาก URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const liffId = urlParams.get('liff.state') || urlParams.get('liff_id');
  
  // ตรวจสอบจาก referrer
  const isFromLine = document.referrer.includes('line.me') || 
                    document.referrer.includes('liff.line.me') ||
                    document.referrer.includes('liff-web.line.me');
  
  // ตรวจสอบจาก hostname ว่าเป็น LIFF URL หรือไม่
  const isLiffUrl = window.location.hostname.includes('liff') || 
                   window.location.hostname.includes('line.me');
  
  // ตรวจสอบว่ามี LIFF SDK และ initialized หรือไม่
  const hasLiffSDK = typeof window.liff !== 'undefined';
  const isLiffInitialized = hasLiffSDK && typeof window.liff.isInClient === 'function';
  
  // ตรวจสอบจาก localStorage หรือ sessionStorage ว่าเคยเข้าจาก LINE หรือไม่
  const hasLineSession = localStorage.getItem('line_liff_session') === 'true' ||
                        sessionStorage.getItem('line_liff_session') === 'true';
  
  // ตรวจสอบจาก window.opener (เมื่อเปิดจาก LINE)
  const hasLineOpener = window.opener && window.opener !== window;
  
  // ตรวจสอบจาก document.referrer ที่มี liff
  const hasLiffReferrer = document.referrer.includes('liff');
  
  const result = isLineApp || !!liffId || isFromLine || isLiffUrl || hasLineSession || hasLineOpener || hasLiffReferrer;
  
  console.log('LIFF Detection:', {
    isLineApp,
    liffId: !!liffId,
    isFromLine,
    isLiffUrl,
    hasLiffSDK,
    isLiffInitialized,
    hasLineSession,
    hasLineOpener,
    hasLiffReferrer,
    result,
    userAgent: userAgent.substring(0, 100), // Truncate for readability
    hostname: window.location.hostname,
    referrer: document.referrer.substring(0, 100) // Truncate for readability
  });
  
  // บันทึกสถานะการเข้าจาก LINE
  if (result) {
    sessionStorage.setItem('line_liff_session', 'true');
    // Only set localStorage if we have strong indicators
    if (isLineApp || !!liffId || isFromLine || isLiffUrl) {
      localStorage.setItem('line_liff_session', 'true');
    }
  }
  
  return result;
};

/**
 * เริ่มต้น LIFF SDK
 */
export const initializeLiff = async (liffId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      console.log('LIFF SDK not available');
      return false;
    }

    // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง - ใช้หลายวิธี
    if (window.liff.isLoggedIn !== undefined || window.__LIFF_INITIALIZED__ === true) {
      console.log('LIFF already initialized, skipping');
      return true;
    }

    await window.liff.init({ liffId });
    console.log('LIFF initialized successfully');
    return true;
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    return false;
  }
};

/**
 * ตรวจสอบสถานะการล็อกอินใน LIFF
 */
export const isLiffLoggedIn = (): boolean => {
  try {
    // ตรวจสอบว่ามี window และ LIFF SDK หรือไม่
    if (typeof window === 'undefined') {
      return false;
    }
    
    // ตรวจสอบว่ามี LIFF SDK หรือไม่
    if (!window.liff) {
      console.log('LIFF SDK not available');
      return false;
    }
    
    // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
    if (typeof window.liff.isLoggedIn !== 'function') {
      console.log('LIFF not properly initialized yet');
      return false;
    }
    
    // ป้องกันการเกิด error เมื่อไม่มี LIFF ID
    try {
      return window.liff.isLoggedIn();
    } catch (innerError) {
      console.warn('Error in liff.isLoggedIn():', innerError);
      return false;
    }
  } catch (error) {
    console.error('Error checking LIFF login status:', error);
    return false;
  }
};

/**
 * ดึงข้อมูลโปรไฟล์จาก LIFF
 */
export const getLiffProfile = async (): Promise<LiffProfile | null> => {
  try {
    // ตรวจสอบว่ามี window และ LIFF SDK หรือไม่
    if (typeof window === 'undefined' || !window.liff) {
      console.error('LIFF SDK not available');
      return null;
    }
    
    // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
    if (typeof window.liff.getProfile !== 'function') {
      console.error('LIFF not properly initialized yet');
      return null;
    }
    
    // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
    if (typeof window.liff.isLoggedIn === 'function' && !window.liff.isLoggedIn()) {
      console.error('User is not logged in to LIFF');
      return null;
    }
    
    // เรียกใช้ฟังก์ชันดึงโปรไฟล์
    const profile = await window.liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error('Error getting LIFF profile:', error);
    return null;
  }
};

/**
 * ดึง Access Token จาก LIFF
 */
export const getLiffAccessToken = (): string | null => {
  try {
    if (typeof window === 'undefined' || !window.liff || !window.liff.isLoggedIn()) {
      return null;
    }
    return window.liff.getAccessToken();
  } catch (error) {
    console.error('Error getting LIFF access token:', error);
    return null;
  }
};

/**
 * ล็อกอินผ่าน LIFF
 */
export const liffLogin = (): void => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      console.error('LIFF SDK not available');
      return;
    }
    
    // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
    if (typeof window.liff.login !== 'function') {
      console.error('LIFF not properly initialized yet');
      return;
    }
    
    // ตรวจสอบว่าอยู่ใน LINE หรือไม่
    const isInLineApp = typeof window.liff.isInClient === 'function' && window.liff.isInClient();
    
    // ใช้ try-catch เพื่อป้องกันการเกิด error
    try {
      // ถ้าอยู่ใน LINE ให้เรียกใช้แบบไม่มี options
      if (isInLineApp) {
        console.log('In LINE app, using login without options');
        window.liff.login();
        return;
      }
      
      // ถ้าไม่ได้อยู่ใน LINE ให้ใช้ redirectUri
      const redirectUri = window.location.href;
      console.log('Not in LINE app, using login with redirectUri:', redirectUri);
      window.liff.login({ redirectUri });
    } catch (loginError) {
      console.error('LIFF login specific error:', loginError);
      // ทดลองเรียกแบบไม่มี options เป็นตัวเลือกสุดท้าย
      try {
        window.liff.login();
      } catch (finalError) {
        console.error('Final LIFF login attempt failed:', finalError);
      }
    }
  } catch (error) {
    console.error('LIFF login error:', error);
  }
};

/**
 * ล็อกเอาท์จาก LIFF
 */
export const liffLogout = (): void => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      console.error('LIFF SDK not available');
      return;
    }
    window.liff.logout();
  } catch (error) {
    console.error('LIFF logout error:', error);
  }
};

/**
 * ปิด LIFF window
 */
export const closeLiffWindow = (): void => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      console.error('LIFF SDK not available');
      return;
    }
    window.liff.closeWindow();
  } catch (error) {
    console.error('Error closing LIFF window:', error);
  }
};

/**
 * ตรวจสอบว่าสามารถใช้ external browser ได้หรือไม่
 */
export const canUseExternalBrowser = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      return false;
    }
    return window.liff.isInClient() && window.liff.isApiAvailable('openWindow');
  } catch (error) {
    console.error('Error checking external browser availability:', error);
    return false;
  }
};

/**
 * เปิด URL ใน external browser
 */
export const openExternalBrowser = (url: string): void => {
  try {
    if (typeof window === 'undefined' || !window.liff) {
      console.error('LIFF SDK not available');
      return;
    }
    
    if (canUseExternalBrowser()) {
      window.liff.openWindow({
        url: url,
        external: true
      });
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Error opening external browser:', error);
    window.open(url, '_blank');
  }
};