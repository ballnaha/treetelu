/**
 * LIFF Manager - จัดการ LIFF initialization และป้องกันการโหลดซ้ำ
 */

declare global {
  interface Window {
    liff: any;
    __LIFF_MANAGER_INITIALIZED__: boolean;
    __LIFF_SDK_LOADED__: boolean;
  }
}

class LiffManager {
  private static instance: LiffManager;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<boolean> | null = null;
  private sdkLoadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): LiffManager {
    if (!LiffManager.instance) {
      LiffManager.instance = new LiffManager();
    }
    return LiffManager.instance;
  }

  /**
   * โหลด LIFF SDK แบบ singleton
   */
  public async loadSDK(): Promise<void> {
    // ถ้า SDK โหลดแล้ว
    if (typeof window !== 'undefined' && (window.liff || window.__LIFF_SDK_LOADED__)) {
      console.log('LIFF SDK already loaded');
      return;
    }

    // ถ้ากำลังโหลดอยู่
    if (this.sdkLoadPromise) {
      console.log('LIFF SDK loading in progress, waiting...');
      return await this.sdkLoadPromise;
    }

    // เริ่มโหลด SDK
    this.sdkLoadPromise = this.performSDKLoad();
    return await this.sdkLoadPromise;
  }

  private async performSDKLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is undefined'));
        return;
      }

      // ตรวจสอบว่ามี script tag อยู่แล้วหรือไม่
      const existingScript = document.querySelector('script[src*="liff/edge/2/sdk.js"]');
      if (existingScript) {
        console.log('LIFF SDK script already exists, waiting for load...');
        const checkLiff = () => {
          if (window.liff) {
            window.__LIFF_SDK_LOADED__ = true;
            resolve();
          } else {
            setTimeout(checkLiff, 100);
          }
        };
        checkLiff();
        return;
      }

      console.log('Loading LIFF SDK from CDN...');
      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.onload = () => {
        console.log('LIFF SDK loaded successfully');
        window.__LIFF_SDK_LOADED__ = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load LIFF SDK:', error);
        reject(new Error('Failed to load LIFF SDK'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize LIFF แบบ singleton
   */
  public async initialize(liffId: string): Promise<boolean> {
    // ตรวจสอบ global flag
    if (typeof window !== 'undefined' && window.__LIFF_MANAGER_INITIALIZED__) {
      console.log('LIFF Manager already initialized globally');
      return true;
    }

    // ถ้า initialize แล้ว
    if (this.isInitialized) {
      console.log('LIFF already initialized (manager)');
      return true;
    }

    // ถ้ากำลัง initialize อยู่
    if (this.isInitializing && this.initPromise) {
      console.log('LIFF initialization in progress, waiting...');
      return await this.initPromise;
    }

    // เริ่ม initialize
    this.isInitializing = true;
    this.initPromise = this.performInitialization(liffId);
    
    try {
      const result = await this.initPromise;
      this.isInitialized = result;
      
      // ตั้งค่า global flag
      if (result && typeof window !== 'undefined') {
        window.__LIFF_MANAGER_INITIALIZED__ = true;
      }
      
      return result;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async performInitialization(liffId: string): Promise<boolean> {
    try {
      // โหลด SDK ก่อน
      await this.loadSDK();

      if (typeof window === 'undefined' || !window.liff) {
        console.log('LIFF SDK not available after loading');
        return false;
      }

      // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
      if (window.liff.isLoggedIn !== undefined) {
        console.log('LIFF already initialized by SDK');
        return true;
      }

      //console.log('Initializing LIFF with ID:', liffId);
      await window.liff.init({ liffId });
      console.log('LIFF initialized successfully');
      
      return true;
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      return false;
    }
  }

  /**
   * ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
   */
  public isLiffInitialized(): boolean {
    return this.isInitialized || 
           (typeof window !== 'undefined' && window.__LIFF_MANAGER_INITIALIZED__) ||
           (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn !== undefined);
  }

  /**
   * Reset สถานะ (สำหรับการทดสอบ)
   */
  public reset(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
    this.sdkLoadPromise = null;
    
    if (typeof window !== 'undefined') {
      window.__LIFF_MANAGER_INITIALIZED__ = false;
      window.__LIFF_SDK_LOADED__ = false;
    }
  }
}

export default LiffManager;