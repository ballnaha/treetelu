/**
 * LIFF Singleton Manager - ป้องกันการ initialize ซ้ำ
 */

declare global {
  interface Window {
    liff: any;
    __LIFF_INITIALIZED__: boolean;
    __LIFF_AUTO_LOGIN_INITIALIZED__: boolean;
  }
}

class LiffSingleton {
  private static instance: LiffSingleton;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): LiffSingleton {
    if (!LiffSingleton.instance) {
      LiffSingleton.instance = new LiffSingleton();
    }
    return LiffSingleton.instance;
  }

  public async initialize(liffId: string): Promise<boolean> {
    // ถ้า initialize แล้ว return true ทันที
    if (this.isInitialized) {
      console.log('LIFF already initialized (singleton)');
      return true;
    }

    // ถ้ากำลัง initialize อยู่ รอให้เสร็จ
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
      return result;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async performInitialization(liffId: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.liff) {
        console.log('LIFF SDK not available');
        return false;
      }

      // ตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
      if (window.liff.isLoggedIn !== undefined) {
        console.log('LIFF already initialized by SDK');
        this.isInitialized = true;
        return true;
      }

      //console.log('Initializing LIFF with ID:', liffId);
      await window.liff.init({ liffId });
      console.log('LIFF initialized successfully');
      
      // ตั้งค่า global flag
      if (typeof window !== 'undefined') {
        window.__LIFF_INITIALIZED__ = true;
      }
      
      return true;
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      return false;
    }
  }

  public isLiffInitialized(): boolean {
    return this.isInitialized || (typeof window !== 'undefined' && window.__LIFF_INITIALIZED__);
  }

  public reset(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
    if (typeof window !== 'undefined') {
      window.__LIFF_INITIALIZED__ = false;
    }
  }
}

export default LiffSingleton;