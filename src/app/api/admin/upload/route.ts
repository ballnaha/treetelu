import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag } from 'next/cache';
import fs from 'fs';
import sharp from 'sharp';

/**
 * POST handler for uploading product images (admin only)
 */
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    console.log('Starting image upload process...');
    
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์รูปภาพ' },
        { status: 400 }
      );
    }
    
    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
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
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const originalName = file.name;
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    
    // Generate unique filename with timestamp to prevent caching
    const timestamp = Date.now();
    const filename = `${uuidv4()}_${timestamp}${ext}`;
    
    // Define paths for both development and production
    const isProd = process.env.NODE_ENV === 'production';
    
    // Define the path to save the file
    // ในโหมด production ให้เก็บไฟล์ไว้ที่ /uploads/images/product แทน /public
    const baseDir = isProd ? join(process.cwd(), 'uploads') : join(process.cwd(), 'public');
    const publicPath = join(baseDir, 'images', 'product');
    const filePath = join(publicPath, filename);
    
    console.log(`Preparing to save file to: ${filePath}`);
    
    // Make sure the directory exists
    if (!fs.existsSync(publicPath)) {
      console.log(`Creating directory: ${publicPath}`);
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    try {
      console.log('Processing image with logo watermark...');

      // กำหนดพาธของโลโก้
      const logoPath = join(process.cwd(), 'public', 'images', 'logo.webp');
      
      // ตรวจสอบว่าไฟล์โลโก้มีอยู่จริง
      if (!fs.existsSync(logoPath)) {
        console.warn('Logo file not found, processing without watermark');
        
        // ถ้าไม่มีโลโก้ ให้ปรับขนาดรูปภาพโดยไม่ใส่ลายน้ำ
        await sharp(buffer)
          .resize(1000, null, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .toFile(filePath);
      } else {
        console.log('Adding logo watermark using padding and top-level gravity...');
        
        // สร้างพื้นที่ว่างรอบภาพ (padding) เพื่อให้มีพื้นที่สำหรับวางโลโก้
        const mainImage = await sharp(buffer)
          .resize(1000, null, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .toBuffer();
        
        // วัดขนาดของรูปภาพหลังจากปรับขนาด
        const imageInfo = await sharp(mainImage).metadata();
        console.log('Resized image dimensions:', imageInfo.width, 'x', imageInfo.height);
        
        // อ่านโลโก้และปรับขนาด/ความโปร่งใส
        const logoBuffer = await sharp(logoPath)
          .resize(150, null, { fit: 'inside' }) // ปรับขนาดโลโก้ให้พอดี
          .ensureAlpha() // ตรวจสอบว่ามี alpha channel
          .modulate({ brightness: 0.8 }) // ลดความสว่างลงเล็กน้อย
          .composite([
            {
              input: Buffer.from([255, 255, 255, 51]), // rgba(255,255,255,0.2)
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'dest-in' // ปรับความโปร่งใสของโลโก้ให้เป็น 20%
            }
          ])
          .toBuffer();
        
        // สร้างข้อมูลโลโก้
        const logoInfo = await sharp(logoBuffer).metadata();
        console.log('Logo dimensions:', logoInfo.width, 'x', logoInfo.height);
        
        // คำนวณตำแหน่งของโลโก้ (มุมล่างขวา)
        const logoX = (imageInfo.width || 1000) - (logoInfo.width || 150) - 40; // ห่างจากขอบขวา 40px
        const logoY = (imageInfo.height || 1000) - (logoInfo.height || 150) - 40; // ห่างจากขอบล่าง 40px
        
        // วางโลโก้บนรูปภาพ
        await sharp(mainImage)
          .composite([
            {
              input: logoBuffer,
              left: logoX > 0 ? logoX : 10,
              top: logoY > 0 ? logoY : 10,
              blend: 'over'
            }
          ])
          .toFile(filePath);
        
        console.log(`Logo placed at position: ${logoX}, ${logoY}`);
      }
      
      console.log('Image processed with logo watermark and saved successfully');
      
      // Verify file was written
      if (!fs.existsSync(filePath)) {
        throw new Error('File was not created successfully');
      }
      
      const stats = fs.statSync(filePath);
      console.log(`File size on disk: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('File was created but is empty');
      }
    } catch (error) {
      console.error('Error processing image with watermark:', error);
      
      // ถ้า sharp ทำงานไม่ได้ ให้ลองปรับขนาดก่อนโดยไม่ใส่ลายน้ำ
      try {
        console.log('Fallback: Resizing image without watermark...');
        await sharp(buffer)
          .resize(1000, null, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .toFile(filePath);
        console.log('Image resized without watermark');
      } catch (resizeError) {
        console.error('Resize fallback failed:', resizeError);
        
        // ถ้ายังไม่ได้ ให้เขียนไฟล์โดยตรง
        try {
          console.log('Fallback: Saving original image...');
          await writeFile(filePath, buffer);
          console.log('Original file saved successfully');
        } catch (fallbackError) {
          console.error('Fallback save failed:', fallbackError);
          return NextResponse.json(
            { 
              success: false, 
              message: 'เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพ',
              error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            },
            { status: 500 }
          );
        }
      }
    }
    
    console.log('Starting cache revalidation...');
    
    // Revalidate everything related to images
    revalidatePath('/images', 'layout');
    revalidatePath('/images/product', 'layout'); 
    revalidatePath('/admin/products', 'layout');
    revalidatePath('/products', 'layout');
    revalidatePath('/', 'layout');
    
    // ใช้ revalidateTag เพิ่มเติมเพื่อ invalidate cache ทั้งหมดที่เกี่ยวข้องกับรูปภาพ
    revalidateTag('products-images');
    revalidateTag('product-images');
    
    console.log('Cache revalidation completed');
    
    // Return success response with the filename and timestamp to prevent caching
    console.log(`Upload successful. Returning filename: ${filename}`);
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
