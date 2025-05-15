import { NextResponse } from 'next/server';

/**
 * API endpoint สำหรับทดสอบการเข้าถึง environment variables
 */
export async function GET(request: Request) {
  try {
    // ตรวจสอบและเซ็นเซอร์ webhook URL
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    const maskedUrl = webhookUrl.length > 10 
      ? `${webhookUrl.substring(0, 8)}...${webhookUrl.substring(webhookUrl.length - 5)}` 
      : 'ไม่มีข้อมูล';
    
    // เตรียมข้อมูลที่จะแสดง
    const envInfo = {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      DISCORD_WEBHOOK_URL: maskedUrl,
      DISCORD_WEBHOOK_URL_LENGTH: webhookUrl.length,
      HAS_WEBHOOK_URL: webhookUrl.length > 0,
      STARTS_WITH_HTTPS: webhookUrl.startsWith('https://'),
      NODE_ENV: process.env.NODE_ENV
    };
    
    return NextResponse.json({
      success: true,
      env: envInfo,
      processEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('DISCORD') || 
        key.includes('URL') || 
        key === 'NODE_ENV'
      )
    });
  } catch (error) {
    console.error('Error in show-env endpoint:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแสดงข้อมูล environment' },
      { status: 500 }
    );
  }
} 