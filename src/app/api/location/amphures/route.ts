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
    
    // รับพารามิเตอร์ provinceId (จำเป็นต้องมี)
    const provinceId = searchParams.get('provinceId') 
      ? parseInt(searchParams.get('provinceId') as string) 
      : undefined;
    
    // ถ้าไม่มี provinceId คืนค่าข้อผิดพลาด
    if (!provinceId) {
      return NextResponse.json(
        { message: 'กรุณาระบุรหัสจังหวัด' },
        { status: 400 }
      );
    }
    
    // สร้างเงื่อนไขการค้นหา
    const whereClause: any = {
      provinceId: provinceId,
      deletedAt: null
    };
    
    // ดึงข้อมูลอำเภอตามเงื่อนไข
    const amphures = await prisma.thaiamphures.findMany({
      where: whereClause,
      orderBy: {
        nameTh: 'asc'
      }
    });
    
    return NextResponse.json(amphures);
  } catch (error) {
    console.error('Error fetching amphures:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอำเภอ' },
      { status: 500 }
    );
  }
} 