import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - ดึงการตั้งค่าค่าจัดส่งปัจจุบัน
export async function GET() {
  try {
    const settings = await prisma.shippingSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (!settings) {
      // สร้างการตั้งค่าเริ่มต้นหากไม่มี
      const defaultSettings = await prisma.shippingSettings.create({
        data: {
          freeShippingMinAmount: 1500.00,
          standardShippingCost: 100.00,
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: defaultSettings.id,
          freeShippingMinAmount: Number(defaultSettings.freeShippingMinAmount),
          standardShippingCost: Number(defaultSettings.standardShippingCost),
          isActive: defaultSettings.isActive,
          updatedAt: defaultSettings.updatedAt
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        freeShippingMinAmount: Number(settings.freeShippingMinAmount),
        standardShippingCost: Number(settings.standardShippingCost),
        isActive: settings.isActive,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' },
      { status: 500 }
    );
  }
}

// POST - อัปเดตการตั้งค่าค่าจัดส่ง (เฉพาะ Admin)
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ในการเข้าถึง' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { freeShippingMinAmount, standardShippingCost } = body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (typeof freeShippingMinAmount !== 'number' || freeShippingMinAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'ยอดขั้นต่ำสำหรับฟรีค่าจัดส่งต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      );
    }

    if (typeof standardShippingCost !== 'number' || standardShippingCost < 0) {
      return NextResponse.json(
        { success: false, error: 'ค่าจัดส่งมาตรฐานต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      );
    }

    // ปิดการใช้งานการตั้งค่าเก่าทั้งหมด
    await prisma.shippingSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // สร้างการตั้งค่าใหม่
    const newSettings = await prisma.shippingSettings.create({
      data: {
        freeShippingMinAmount,
        standardShippingCost,
        isActive: true,
        updatedBy: decoded.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'อัปเดตการตั้งค่าค่าจัดส่งเรียบร้อยแล้ว',
      data: {
        id: newSettings.id,
        freeShippingMinAmount: Number(newSettings.freeShippingMinAmount),
        standardShippingCost: Number(newSettings.standardShippingCost),
        isActive: newSettings.isActive,
        updatedAt: newSettings.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า' },
      { status: 500 }
    );
  }
}