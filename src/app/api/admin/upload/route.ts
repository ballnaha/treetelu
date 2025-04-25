import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * POST handler for uploading product images (admin only)
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์รูปภาพ' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const originalName = file.name;
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    
    // Generate unique filename with timestamp to prevent caching
    const timestamp = Date.now();
    const filename = `${uuidv4()}_${timestamp}${ext}`;
    
    // Define the path to save the file
    const publicPath = join(process.cwd(), 'public', 'images', 'product');
    const filePath = join(publicPath, filename);
    
    // Write the file to disk
    await writeFile(filePath, buffer);
    
    // Revalidate everything related to images
    revalidatePath('/images', 'layout');
    revalidatePath('/images/product', 'layout'); 
    revalidatePath('/admin/products', 'layout');
    revalidatePath('/products', 'layout');
    revalidatePath('/', 'layout');
    
    // ใช้ revalidateTag เพิ่มเติมเพื่อ invalidate cache ทั้งหมดที่เกี่ยวข้องกับรูปภาพ
    revalidateTag('products-images');
    
    // Return success response with the filename and timestamp to prevent caching
    return NextResponse.json({
      success: true,
      message: 'อัปโหลดรูปภาพเรียบร้อย',
      filename: filename,
      url: `/images/product/${filename}?t=${timestamp}` // เพิ่ม timestamp เพื่อป้องกันการแคช
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    let errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
        error: errorDetails
      },
      { status: 500 }
    );
  }
});

// Set larger body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};
