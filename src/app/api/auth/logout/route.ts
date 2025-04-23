import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // สร้าง response
    const response = NextResponse.json({ success: true });
    
    // ลบ cookie ที่ชื่อถูกต้อง (auth_token)
    response.cookies.delete('auth_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}
