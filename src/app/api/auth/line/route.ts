import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// LINE API endpoints
const LINE_TOKEN_API = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_API = 'https://api.line.me/v2/profile';

// LINE credentials should be stored in .env file
const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID || '';
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET || '';
const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI || 'http://localhost:3001/api/auth/line';

// เพิ่มค่า BASE_URL ให้ถูกต้อง
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://treetelu.com';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the request
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    
    if (!code) {
      return NextResponse.json({ error: 'ไม่พบรหัสการอนุญาต' }, { status: 400 });
    }
    
    // สร้าง URL params สำหรับการขอ token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINE_REDIRECT_URI,
      client_id: LINE_CLIENT_ID,
      client_secret: LINE_CLIENT_SECRET,
    }).toString();
    
    
    // Exchange the code for an access token
    const tokenResponse = await fetch(LINE_TOKEN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });
    
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { rawResponse: errorText };
      }
      console.error('LINE token error:', errorData);
      return NextResponse.json({ 
        error: 'การรับโทเค็นผิดพลาด', 
        details: errorData 
      }, { status: 400 });
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;
    
    // Get the user profile using the access token
    const profileResponse = await fetch(LINE_PROFILE_API, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { rawResponse: errorText };
      }
      console.error('LINE profile error:', errorData);
      return NextResponse.json({ 
        error: 'การรับข้อมูลผู้ใช้ผิดพลาด',
        details: errorData
      }, { status: 400 });
    }
    
    const profileData = await profileResponse.json();
    const { userId: lineId, displayName, pictureUrl } = profileData;
    
    // Check if user exists with this LINE ID
    let user = await prisma.users.findFirst({
      where: {
        // @ts-ignore - lineId ถูกกำหนดไว้ในฐานข้อมูล
        lineId: lineId
      },
    });
    
    
    // If user doesn't exist, create a new one
    if (!user) {
      // Generate a random email with LINE prefix for internal use
      const randomEmail = `line_${lineId}@lineuser.treetelu.com`;
      
      // Split displayName into firstName and lastName
      const names = displayName.split(' ');
      const firstName = names[0] || displayName;
      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      
      try {
        user = await prisma.users.create({
          data: {
            firstName,
            lastName,
            email: randomEmail,
            // @ts-ignore - lineId ถูกกำหนดไว้ในฐานข้อมูล
            lineId: lineId,
            avatar: pictureUrl || null,
            emailVerifiedAt: new Date(), // LINE users are considered verified
            password: '', // No password for LINE users
            // @ts-ignore - กำหนดให้ผู้ใช้ LINE เป็น false เสมอ
            isAdmin: 'false', // LINE users are never admins by default
          },
        });
       
      } catch (createError) {
        console.error('- Error creating user:', createError);
        return NextResponse.json({ 
          error: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้',
          details: String(createError)
        }, { status: 500 });
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        isAdmin: String(user.isAdmin) === 'true',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    
    // Generate CSRF token
    const csrfToken = uuidv4();
    
    // Redirect to frontend with token data
    const redirectUrl = new URL('/login/callback', BASE_URL);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('userId', user.id.toString());
    redirectUrl.searchParams.set('name', `${user.firstName} ${user.lastName}`);
    redirectUrl.searchParams.set('isAdmin', user.isAdmin ? 'true' : 'false');
    redirectUrl.searchParams.set('csrfToken', csrfToken);
    
    // ตรวจสอบและส่งค่า avatar ถ้ามี property นี้
    // @ts-ignore - ส่ง avatar ถ้ามี
    if (user.avatar) {
      // @ts-ignore - property อาจไม่มีใน type แต่มีในข้อมูลจริง
      redirectUrl.searchParams.set('avatar', user.avatar);
      // @ts-ignore
    } else {
      redirectUrl.searchParams.set('avatar', '');
    }
    
    redirectUrl.searchParams.set('isLineUser', 'true');
    
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('LINE login error:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE',
      details: String(error)
    }, { status: 500 });
  }
} 