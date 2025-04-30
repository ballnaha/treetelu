import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import fs_sync from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, revalidateTag } from 'next/cache';

// API endpoint สำหรับอัปโหลดรูปภาพ
export async function POST(req: NextRequest) {
  try {
    // รับข้อมูลจาก FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    // ตรวจสอบว่ามีไฟล์หรือไม่
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // ตรวจสอบประเภทของไฟล์
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // อ่านข้อมูลไฟล์
    const fileBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(fileBuffer);
    
    // สร้างชื่อไฟล์ใหม่ด้วย UUID เพื่อป้องกันการซ้ำกัน
    const timestamp = Date.now();
    const fileName = `${uuidv4()}_${timestamp}_${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    // กำหนดพาธสำหรับบันทึกรูปภาพตามโหมดการทำงาน
    const isProd = process.env.NODE_ENV === 'production';
    
    // กำหนดโฟลเดอร์ตามโหมดการทำงาน
    const baseDir = isProd ? path.join(process.cwd(), 'uploads') : path.join(process.cwd(), 'public');
    const uploadDir = path.join(baseDir, 'images', 'blog');
    
    console.log('ตรวจสอบและสร้างโฟลเดอร์:', uploadDir);
    
    // ตรวจสอบและสร้างโฟลเดอร์ถ้าไม่มี
    try {
      if (!fs_sync.existsSync(uploadDir)) {
        fs_sync.mkdirSync(uploadDir, { recursive: true });
        console.log('สร้างโฟลเดอร์สำเร็จ:', uploadDir);
      }
    } catch (dirError) {
      console.error('เกิดข้อผิดพลาดในการสร้างโฟลเดอร์:', dirError);
      return NextResponse.json({ 
        error: 'Failed to create upload directory',
        details: dirError instanceof Error ? dirError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    const filePath = path.join(uploadDir, fileName);
    console.log('กำลังบันทึกไฟล์ไปที่:', filePath);
    
    // บันทึกไฟล์
    try {
      await fs.writeFile(filePath, fileData);
      console.log('บันทึกไฟล์สำเร็จ:', filePath);
      
      // ตรวจสอบว่าไฟล์ถูกบันทึกสำเร็จหรือไม่
      if (!fs_sync.existsSync(filePath)) {
        throw new Error('File was not created successfully');
      }
      
      const stats = fs_sync.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('File was created but is empty');
      }
      
      console.log('ข้อมูลไฟล์:', {
        size: stats.size,
        path: filePath,
        name: fileName
      });
    } catch (fileError) {
      console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์:', fileError);
      return NextResponse.json({ 
        error: 'Failed to save file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Revalidate cache
    console.log('กำลัง revalidate cache...');
    revalidatePath('/blog', 'layout');
    revalidatePath('/images/blog', 'layout');
    revalidatePath('/admin/blogs', 'layout');
    
    // ส่งข้อมูลกลับไป
    return NextResponse.json({
      success: true,
      fileName,
      url: `/images/blog/${fileName}`,
      timestamp
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// API endpoint สำหรับลบรูปภาพ
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }
    
    // กำหนดพาธสำหรับลบรูปภาพตามโหมดการทำงาน
    const isProd = process.env.NODE_ENV === 'production';
    
    // กำหนดโฟลเดอร์ตามโหมดการทำงาน
    const baseDir = isProd ? path.join(process.cwd(), 'uploads') : path.join(process.cwd(), 'public');
    const uploadDir = path.join(baseDir, 'images', 'blog');
    
    // สร้างพาธของไฟล์
    const filePath = path.join(uploadDir, filename);
    
    console.log('พยายามลบไฟล์:', filePath);
    
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (!fs_sync.existsSync(filePath)) {
      console.log('ไม่พบไฟล์:', filePath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // ลบไฟล์
    try {
      fs_sync.unlinkSync(filePath);
      console.log('ลบไฟล์สำเร็จ:', filePath);
      
      // Revalidate cache
      revalidatePath('/blog', 'layout');
      revalidatePath('/images/blog', 'layout');
      revalidatePath('/admin/blogs', 'layout');
      
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบไฟล์:', error);
      return NextResponse.json({ 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in DELETE API route:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 