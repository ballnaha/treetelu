import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';

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
    
    // Generate unique filename
    const filename = `${uuidv4()}${ext}`;
    
    // Define the path to save the file
    const publicPath = join(process.cwd(), 'public', 'images', 'product');
    const filePath = join(publicPath, filename);
    
    // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
      console.log(`Created directory: ${publicPath}`);
    }
    
    try {
      // แปลงและบันทึกรูปภาพด้วย sharp
      await sharp(buffer)
        .resize(800) // ปรับขนาดให้มีความกว้าง 800px
        .toFormat('jpeg') // แปลงเป็นรูปแบบ jpeg
        .jpeg({ quality: 85 }) // ตั้งค่าคุณภาพ
        .toFile(filePath);
      
      console.log(`Successfully saved optimized image to: ${filePath}`);
    } catch (sharpError) {
      console.error(`Sharp error: ${sharpError}`);
      // ถ้าล้มเหลวในการใช้ sharp ให้บันทึกไฟล์โดยตรง
      await writeFile(filePath, buffer);
      console.log(`Fallback: Saved original image to: ${filePath}`);
    }
    
    // ทดสอบว่าไฟล์ถูกบันทึกจริงหรือไม่
    const fileExists = fs.existsSync(filePath);
    console.log(`File exists check: ${fileExists}`);
    
    // ล้าง cache หรือดึงข้อมูลใหม่ถ้าเป็นไปได้
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/images/product');
      console.log('Revalidated path: /images/product');
    } catch (revalidateError) {
      console.log('Revalidation not available:', revalidateError);
    }
    
    // Return success response with the filename
    return NextResponse.json({
      success: true,
      message: 'อัปโหลดรูปภาพเรียบร้อย',
      filename: filename,
      path: `/images/product/${filename}`,
      fullUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/images/product/${filename}?v=${Date.now()}`
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
