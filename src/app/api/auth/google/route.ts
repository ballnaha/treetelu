import { NextRequest, NextResponse } from 'next/server';

// Google OAuth credentials - ควรเก็บใน .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

// URL สำหรับการ authentication กับ Google
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบว่ามีการตั้งค่า GOOGLE_CLIENT_ID หรือไม่
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google client credentials not configured');
      return NextResponse.redirect(
        new URL('/login?error=configuration_error&error_description=Google Login is not properly configured', request.url)
      );
    }

    // สร้าง state สำหรับป้องกัน CSRF
    const state = Math.random().toString(36).substring(2);
    
    // สร้าง URL สำหรับเริ่มต้นการ authentication กับ Google
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'profile email');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'select_account');
    
    // เก็บ state ใน cookie เพื่อตรวจสอบความถูกต้องเมื่อมีการ callback
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('google_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 นาที
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_error&error_description=Error initializing Google authentication', request.url)
    );
  }
} 