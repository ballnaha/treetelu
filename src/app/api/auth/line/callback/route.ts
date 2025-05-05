import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  // ดึงโค้ดและสเตทจาก URL
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // ถ้ามีข้อผิดพลาด redirect ไปยังหน้า login พร้อมกับแสดงข้อผิดพลาด
  if (error) {
    const errorDesc = searchParams.get('error_description');
    return NextResponse.redirect(new URL(`/login?error=${error}&error_description=${errorDesc}`, request.url));
  }
  
  // ตรวจสอบว่ามีโค้ดและสเตทหรือไม่
  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=invalid_request&error_description=Missing code or state parameter', request.url));
  }
  
  try {
    // สร้าง URL สำหรับเรียก API เพื่อขอ access token
    const tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
    const clientSecret = process.env.LINE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/line/callback`;
    
    if (!clientId || !clientSecret) {
      console.error('LINE client credentials not configured');
      return NextResponse.redirect(new URL('/login?error=configuration_error&error_description=LINE Login is not properly configured', request.url));
    }
    
    // ขอ access token จาก LINE
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    // ตรวจสอบสถานะการตอบกลับ
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('LINE token error:', errorData);
      return NextResponse.redirect(new URL(`/login?error=token_error&error_description=${errorData.error_description || 'Failed to get token'}`, request.url));
    }
    
    // แปลง response เป็น JSON
    const tokenData = await tokenResponse.json();
    
    // ดึงข้อมูลผู้ใช้จาก id_token
    let userData;
    let lineId: string;
    let displayName: string;
    let emailAddress: string | null = null;
    let profilePicture: string | null = null;
    
    if (tokenData.id_token) {
      // ถอดรหัส id_token เพื่อดึงข้อมูลผู้ใช้
      const idTokenPayload = JSON.parse(atob(tokenData.id_token.split('.')[1]));
      lineId = idTokenPayload.sub;
      displayName = idTokenPayload.name || 'LINE User';
      emailAddress = idTokenPayload.email || null;
      profilePicture = idTokenPayload.picture || null;
    } else {
      // ถ้าไม่มี id_token ให้เรียก Profile API เพื่อดึงข้อมูลผู้ใช้
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });
      
      if (!profileResponse.ok) {
        const profileError = await profileResponse.json();
        console.error('LINE profile error:', profileError);
        return NextResponse.redirect(new URL(`/login?error=profile_error&error_description=${profileError.message || 'Failed to get profile'}`, request.url));
      }
      
      const profileData = await profileResponse.json();
      lineId = profileData.userId;
      displayName = profileData.displayName || 'LINE User';
      profilePicture = profileData.pictureUrl || null;
    }
    
    // แยกชื่อ-นามสกุลจากชื่อที่ได้รับจาก LINE
    let firstName = displayName;
    let lastName = '';
    
    // หากชื่อมีช่องว่าง แยกเป็นชื่อ-นามสกุล
    if (displayName.includes(' ')) {
      const nameParts = displayName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    // สร้างรหัสผ่านแบบสุ่ม (เนื่องจากตาราง users ต้องการรหัสผ่าน)
    const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // ตรวจสอบว่ามีผู้ใช้ที่มีอีเมลนี้อยู่แล้วหรือไม่
    let user: any = null;
    
    // ค้นหาผู้ใช้จาก lineId ก่อน (เพื่อให้สามารถล็อกอินด้วย LINE ซ้ำได้)
    try {
      // ใช้ where ที่ไม่ระบุ lineId ที่อาจไม่มีใน schema แต่ใช้การเปรียบเทียบข้อมูลที่ดึงมา
      const users = await prisma.users.findMany({
        where: {}
      });
      
      // กรองผู้ใช้ที่มี lineId ตรงกับที่ต้องการในโค้ด JavaScript
      user = users.find(u => (u as any).lineId === lineId);
    } catch (error) {
      console.error('Error finding user by lineId:', error);
    }
    
    // ถ้าไม่พบผู้ใช้จาก lineId ให้ลองค้นหาจากอีเมล
    if (!user && emailAddress) {
      user = await prisma.users.findUnique({
        where: {
          email: emailAddress
        }
      });
    }
    
    // สร้างหรืออัปเดตผู้ใช้
    if (!user) {
      // สร้างอีเมลเป็น lineId@line.me ถ้าไม่มีอีเมล
      const email = emailAddress || `${lineId}@line.me`;
      
      // เข้ารหัสรหัสผ่านด้วย bcrypt ก่อนบันทึก
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // คำนวณเวลาหมดอายุของ token
      const tokenExpires = new Date();
      tokenExpires.setSeconds(tokenExpires.getSeconds() + (tokenData.expires_in || 60 * 60 * 24 * 7)); // 7 วันถ้าไม่มีค่า expires_in
      
      // สร้าง JSON สำหรับเก็บโปรไฟล์ LINE
      const lineProfileData = {
        id: lineId,
        displayName: displayName,
        picture: profilePicture,
        email: emailAddress
      };
      
      // เพิ่มข้อมูล LINE_ID และ profilePicture ในฐานข้อมูล
      try {
        user = await (prisma.users as any).create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isAdmin: 'false',
            // ใช้ JSON.stringify เพื่อเก็บค่า lineId และข้อมูลอื่นๆ ในฟิลด์ rememberToken ชั่วคราว
            rememberToken: JSON.stringify({
              lineId,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: tokenExpires.toISOString(),
              profile: lineProfileData
            }),
            profilePicture: profilePicture,
            lastLoginAt: new Date()
          }
        });
      } catch (err) {
        console.error('Error creating user:', err);
        return NextResponse.redirect(new URL('/login?error=registration_error&error_description=Failed to create user account', request.url));
      }
    } else {
      // อัปเดตข้อมูลผู้ใช้ที่มีอยู่แล้ว (อัปเดต profilePicture ถ้ามีการเปลี่ยนแปลง)
      try {
        // คำนวณเวลาหมดอายุของ token
        const tokenExpires = new Date();
        tokenExpires.setSeconds(tokenExpires.getSeconds() + (tokenData.expires_in || 60 * 60 * 24 * 7)); // 7 วันถ้าไม่มีค่า expires_in
        
        // สร้าง JSON สำหรับเก็บโปรไฟล์ LINE
        const lineProfileData = {
          id: lineId,
          displayName: displayName,
          picture: profilePicture,
          email: emailAddress
        };
        
        // อัปเดตเฉพาะข้อมูลที่มีการเปลี่ยนแปลง
        user = await (prisma.users as any).update({
          where: { id: user.id },
          data: {
            firstName: firstName,
            lastName: lastName,
            profilePicture: profilePicture,
            // ใช้ JSON.stringify เพื่อเก็บค่า lineId และข้อมูลอื่นๆ ในฟิลด์ rememberToken ชั่วคราว
            rememberToken: JSON.stringify({
              lineId,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: tokenExpires.toISOString(),
              profile: lineProfileData
            }),
            lastLoginAt: new Date()
          }
        });
      } catch (err) {
        console.error('Error updating user profile:', err);
        // ไม่ต้อง redirect เพราะไม่ใช่ข้อผิดพลาดร้ายแรง ใช้ข้อมูลเดิมได้
      }
    }
    
    // สร้างข้อมูลที่จะส่งกลับไปให้ client
    const userResponse = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      isLoggedIn: true,
      isAdmin: user.isAdmin === 'true',
      profilePicture: user.profilePicture // ใช้ profilePicture จากฐานข้อมูล
    };
    
    // สร้าง token สำหรับการใช้งาน
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    const sessionToken = jwt.sign(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, // 7 วัน
      jwtSecret
    );
    
    // สร้างการตอบกลับและเก็บข้อมูลผู้ใช้ใน cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // เก็บ token ใน cookie
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    // เก็บ token จาก LINE สำหรับใช้งานกับ LINE API (ถ้าต้องการ)
    response.cookies.set('line_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    if (tokenData.refresh_token) {
      response.cookies.set('line_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    }
    
    // เพิ่ม JavaScript สำหรับตั้งค่า localStorage ของ user หลังจาก redirect
    // ตั้งค่า cookie ในรูปแบบที่ทำงานกับ JavaScript ใน browser
    response.cookies.set('user_data', JSON.stringify(userResponse), {
      httpOnly: false, // ไม่ใช่ httpOnly เพื่อให้ JavaScript อ่านได้
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('LINE callback error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error&error_description=An unexpected error occurred', request.url));
  }
} 