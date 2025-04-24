import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

/**
 * GET handler for fetching the latest product SKU (admin only)
 * Used for auto-generating SKUs with incrementing numbers
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    console.log('Fetching latest product SKU');
    
    // Get the latest product ordered by SKU in descending order
    const latestProduct = await prisma.product.findFirst({
      orderBy: {
        sku: 'desc'
      },
      select: {
        sku: true
      }
    });

    console.log('Latest product SKU:', latestProduct?.sku || 'No products found');
    
    return NextResponse.json({
      success: true,
      latestSku: latestProduct?.sku || null
    });
  } catch (error) {
    console.error('Error fetching latest SKU:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรหัสสินค้าล่าสุด',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});
