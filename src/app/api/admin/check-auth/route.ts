import { NextRequest, NextResponse } from 'next/server';
import { validateAdminUser } from '@/lib/auth';

/**
 * API endpoint สำหรับตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
 */
export async function GET(request: NextRequest) {
  const result = await validateAdminUser(request);
  
  if (!result.isAdmin) {
    return NextResponse.json(
      { authorized: false, message: result.error },
      { status: 401 }
    );
  }
  
  return NextResponse.json({
    authorized: true,
    userId: result.userId
  });
} 