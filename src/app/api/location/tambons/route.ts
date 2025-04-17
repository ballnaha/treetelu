import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // ดึงพารามิเตอร์จาก URL
    let searchParams;
    try {
      searchParams = new URL(request.url).searchParams;
    } catch (error) {
      console.error("Invalid URL:", request.url);
      searchParams = new URLSearchParams();
    }
    
    // รับพารามิเตอร์ amphureId (จำเป็นต้องมี)
    const amphureId = searchParams.get('amphureId') 
      ? parseInt(searchParams.get('amphureId') as string) 
      : undefined;
    
    // ถ้าไม่มี amphureId คืนค่าข้อผิดพลาด
    if (!amphureId) {
      return NextResponse.json(
        { message: 'กรุณาระบุรหัสอำเภอ' },
        { status: 400 }
      );
    }
    
    // สร้างเงื่อนไขการค้นหา
    const whereClause: any = {
      amphureId: amphureId,
      deletedAt: null
    };
    
    // ดึงข้อมูลตำบลตามเงื่อนไข
    const tambons = await prisma.thaitambons.findMany({
      where: whereClause,
      orderBy: {
        nameTh: 'asc'
      }
    });
    
    return NextResponse.json(tambons);
  } catch (error) {
    console.error('Error fetching tambons:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตำบล' },
      { status: 500 }
    );
  }
} 