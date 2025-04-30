import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import fs_sync from 'fs';

// กำหนดพาธสำหรับบันทึกรูปภาพ
const uploadDir = path.join(process.cwd(), 'public/images/blog');

// ตรวจสอบว่ามีโฟลเดอร์สำหรับบันทึกรูปภาพหรือไม่ ถ้าไม่มีให้สร้างใหม่
async function ensureUploadDirectory() {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// API endpoint สำหรับอัปโหลดรูปภาพ
export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบและสร้างโฟลเดอร์สำหรับบันทึกรูปภาพ
    await ensureUploadDirectory();
    
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
    const fileName = `${uuidv4()}_${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = path.join(uploadDir, fileName);
    
    // บันทึกไฟล์
    await fs.writeFile(filePath, fileData);
    
    // ส่งข้อมูลกลับไป
    return NextResponse.json({
      success: true,
      fileName,
      url: `/images/blog/${fileName}`
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