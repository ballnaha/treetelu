/**
 * Utility functions for LINE LIFF integration
 */

declare global {
  interface Window {
    liff: any;
    __LIFF_INITIALIZED__: boolean;
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
  const isFromLine = document.referrer.includes('line.me') || document.referrer.includes('liff.line.me');
  
  // ตรวจสอบจาก hostname ว่าเป็น LIFF URL หรือไม่
  const isLiffUrl = window.location.hostname.includes('liff') || window.location.hostname.includes('line.me');
  
  // ตรวจสอบว่ามี LIFF SDK หรือไม่
  const hasLiffSDK = typeof window.liff !== 'undefined';
  
  console.log('LIFF Detection:', {
    isLineApp,
    liffId: !!liffId,
    isFromLine,
    isLiffUrl,
    hasLiffSDK,
    userAgent,
    hostname: window.location.hostname,
    referrer: document.referrer
  });
  
  return isLineApp || !!liffId || isFromLine || isLiffUrl || hasLiffSDK;
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
    if (window.liff.isLoggedIn !== undefined || window.__LIFF_INITIALIZED__) {
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
    if (typeof window === 'undefined' || !window.liff) {
      return false;
    }
    return window.liff.isLoggedIn();
  } catch (error) {
    console.error('Error checking LIFF login status:', error);
    return false;
  }
};

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก LIFF
 */
export const getLiffProfile = async (): Promise<LiffProfile | null> => {
  try {
    if (typeof window === 'undefined' || !window.liff || !window.liff.isLoggedIn()) {
      return null;
    }

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
    window.liff.login();
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