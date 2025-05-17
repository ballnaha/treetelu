import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Google API credentials - ควรเก็บใน .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// Google API endpoints
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// เพิ่มค่า BASE_URL ให้ถูกต้อง
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://treetelu.com';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';

export async function GET(request: NextRequest) {
  try {
    // ดึง code และ state จาก URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // ดึง state จาก cookie สำหรับตรวจสอบ CSRF
    const storedState = request.cookies.get('google_auth_state')?.value;
    
    // ตรวจสอบว่ามี code หรือไม่
    if (!code) {
      console.error('No authorization code found');
      return NextResponse.redirect(
        new URL('/login?error=auth_error&error_description=No authorization code provided', request.url)
      );
    }
    
    // ตรวจสอบ state เพื่อป้องกัน CSRF attack
    if (state !== storedState) {
      console.error('State mismatch - potential CSRF attack');
      return NextResponse.redirect(
        new URL('/login?error=auth_error&error_description=Invalid authentication state', request.url)
      );
    }
    
    // แลกเปลี่ยน code เพื่อรับ access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token error:', errorData);
      return NextResponse.redirect(
        new URL(`/login?error=token_error&error_description=${errorData.error_description || 'Failed to get token'}`, request.url)
      );
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // ใช้ access token เพื่อดึงข้อมูลผู้ใช้
    const userInfoResponse = await fetch(GOOGLE_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      const userInfoError = await userInfoResponse.json();
      console.error('Google user info error:', userInfoError);
      return NextResponse.redirect(
        new URL(`/login?error=profile_error&error_description=${userInfoError.error?.message || 'Failed to get user info'}`, request.url)
      );
    }
    
    const userData = await userInfoResponse.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    const googleId = userData.id;
    const email = userData.email;
    const name = userData.name || email.split('@')[0];
    const picture = userData.picture;
    
    if (!googleId || !email) {
      console.error('Missing critical user data from Google');
      return NextResponse.redirect(
        new URL('/login?error=auth_error&error_description=Incomplete user data from Google', request.url)
      );
    }
    
    // แยกชื่อและนามสกุล
    let firstName = name;
    let lastName = '';
    
    if (name.includes(' ')) {
      const nameParts = name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      },
    });
    
    // ถ้าผู้ใช้มีอีเมลที่ตรงกันแต่ยังไม่ได้เชื่อมต่อ Google
    if (user && !user.googleId) {
      // อัปเดตข้อมูลผู้ใช้เพื่อเชื่อมต่อกับบัญชี Google
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: picture || user.avatar,
        },
      });
    }
    
    // ถ้าผู้ใช้ยังไม่มีในระบบ ให้สร้างใหม่
    if (!user) {
      try {
        user = await prisma.users.create({
          data: {
            firstName,
            lastName,
            email,
            googleId,
            avatar: picture,
            emailVerifiedAt: new Date(), // Google users are considered verified
            password: '', // ไม่ต้องมีรหัสผ่านสำหรับผู้ใช้ Google
            isAdmin: 'false', // Google users are never admins by default
          },
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.redirect(
          new URL('/login?error=db_error&error_description=Failed to create user account', request.url)
        );
      }
    }
    
    // สร้าง JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        isAdmin: String(user.isAdmin) === 'true',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // สร้าง CSRF token
    const csrfToken = uuidv4();
    
    // สร้าง URL สำหรับ redirect กลับไปที่หน้า callback
    const redirectUrl = new URL('/login/callback', BASE_URL);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('userId', String(user.id));
    redirectUrl.searchParams.set('name', `${user.firstName} ${user.lastName}`.trim());
    redirectUrl.searchParams.set('isAdmin', String(user.isAdmin) === 'true' ? 'true' : 'false');
    redirectUrl.searchParams.set('csrfToken', csrfToken);
    redirectUrl.searchParams.set('avatar', user.avatar || '');
    redirectUrl.searchParams.set('isGoogleUser', 'true');
    
    // ลบ cookie state เนื่องจากไม่จำเป็นต้องใช้อีกต่อไป
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('google_auth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Google auth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_error&error_description=Authentication process failed', request.url)
    );
  }
} 