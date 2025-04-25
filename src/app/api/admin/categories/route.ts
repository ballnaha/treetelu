import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import prisma from '@/lib/prisma';

/**
 * GET handler for fetching all categories (admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  console.log('Admin categories API called');
  try {
    // Fetch all categories
    const categories = await prisma.category.findMany({
      orderBy: { priority: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error in categories API endpoint:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
    } else {
      errorDetails = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
});
