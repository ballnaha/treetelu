import { NextRequest, NextResponse } from 'next/server';
import { validateAdminUser } from '@/lib/auth';

/**
 * API endpoint สำหรับตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
 */
export async function GET(request: NextRequest) {
  console.log('Checking admin authorization...');
  const result = await validateAdminUser(request);
  
  console.log('Admin check result:', result);
  console.log('Admin check isAdmin value type:', typeof result.isAdmin);
  
  if (!result.isAdmin) {
    console.log('User is not authorized as admin');
    return NextResponse.json(
      { authorized: false, message: result.error },
      { status: 401 }
    );
  }
  
  console.log('User is authorized as admin, userId:', result.userId);
  return NextResponse.json({
    authorized: true,
    userId: result.userId
  });
} 