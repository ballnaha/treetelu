import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('LIFF Login API called');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { profile, accessToken }: { profile: LiffProfile; accessToken: string } = body;

    if (!profile || !profile.userId || !profile.displayName) {
      console.error('Invalid profile data:', profile);
      return NextResponse.json({ error: 'ข้อมูลโปรไฟล์ไม่ครบถ้วน' }, { status: 400 });
    }

    const { userId: lineId, displayName, pictureUrl } = profile;

    // ตรวจสอบว่ามีผู้ใช้ที่มี LINE ID นี้อยู่แล้วหรือไม่
    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { lineId: lineId },
          { rememberToken: lineId }
        ]
      },
    });

    // ถ้าไม่พบผู้ใช้ ให้สร้างใหม่
    if (!user) {
      // สร้างอีเมลแบบสุ่มสำหรับผู้ใช้ LINE
      const randomEmail = `line_${lineId}@lineuser.treetelu.com`;
      
      // แยกชื่อ-นามสกุล
      const names = displayName.split(' ');
      const firstName = names[0] || displayName;
      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      
      // สร้างรหัสผ่านแบบสุ่ม
      const randomPassword = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);



      try {
        user = await prisma.users.create({
          data: {
            firstName,
            lastName,
            email: randomEmail,
            password: hashedPassword,
            isAdmin: 'false',
            rememberToken: lineId, // เก็บแค่ LINE ID แทน JSON เพื่อไม่ให้เกิน 100 ตัวอักษร
            avatar: pictureUrl || null,
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
            lineId: lineId // เก็บ LINE ID ในฟิลด์ที่เหมาะสม
          },
        });

        console.log('Created new LIFF user:', user.id);
      } catch (createError: any) {
        console.error('Error creating LIFF user:', createError);
        
        // ตรวจสอบข้อผิดพลาดเฉพาะ
        if (createError.code === 'P2002') {
          return NextResponse.json({ 
            error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาลองใหม่อีกครั้ง',
            details: 'Duplicate email'
          }, { status: 409 });
        }
        
        if (createError.message?.includes('Data too long')) {
          return NextResponse.json({ 
            error: 'ข้อมูลโปรไฟล์ยาวเกินไป กรุณาลองใหม่อีกครั้ง',
            details: 'Data too long for database field'
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้ กรุณาลองใหม่อีกครั้ง',
          details: createError.message || String(createError)
        }, { status: 500 });
      }
    } else {
      // อัปเดตข้อมูลผู้ใช้ที่มีอยู่แล้ว
      try {
        // แยกชื่อ-นามสกุลใหม่ (อาจมีการเปลี่ยนแปลง)
        const names = displayName.split(' ');
        const firstName = names[0] || displayName;
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            avatar: pictureUrl || user.avatar,
            lineId: lineId,
            rememberToken: lineId,
            updatedAt: new Date()
          }
        });

        console.log('Updated existing LIFF user:', user.id);
      } catch (updateError) {
        console.error('Error updating LIFF user:', updateError);
        // ไม่ return error เพราะไม่ใช่ข้อผิดพลาดร้ายแรง
      }
    }

    // สร้าง JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        isAdmin: String(user.isAdmin) === 'true',
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // สร้าง CSRF token
    const csrfToken = uuidv4();

    // ส่งข้อมูลผู้ใช้กลับไป
    const userData = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      isAdmin: String(user.isAdmin) === 'true',
      avatar: user.avatar || pictureUrl || '',
      token,
      csrfToken
    };

    // ตั้งค่า cookies
    const response = NextResponse.json(userData);
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('LIFF login error:', error);
    return NextResponse.json({ 
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LIFF',
      details: String(error)
    }, { status: 500 });
  }
}