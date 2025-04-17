import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getBangkokDateTime } from '@/utils/dateUtils';
import { Decimal } from '@prisma/client/runtime/library';

// ฟังก์ชันสำหรับอัพโหลดไฟล์ไปยัง storage และ resize ภาพ
async function uploadFileToStorage(file: Buffer, filename: string): Promise<string> {
  try {
    // สร้าง unique filename
    const uniqueFilename = `${uuidv4()}-${filename}`;
    
    // กำหนดโฟลเดอร์สำหรับเก็บไฟล์
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-slips');
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // ตรวจสอบและสร้างโฟลเดอร์หากยังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Resize รูปภาพด้วย sharp
    await sharp(file)
      .resize({ width: 800, withoutEnlargement: true }) // ปรับขนาดให้มีความกว้างไม่เกิน 800px
      .jpeg({ quality: 80 }) // บีบอัดเป็น JPEG คุณภาพ 80%
      .toFile(filePath);
    
    // สร้าง URL สำหรับเรียกใช้ไฟล์
    const fileUrl = `/uploads/payment-slips/${uniqueFilename}`;
    
    console.log(`Resized and saved image to: ${filePath}`);
    return fileUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
  }
}

// สร้าง schema สำหรับตรวจสอบข้อมูลการยืนยันการชำระเงิน
const paymentConfirmationSchema = z.object({
  orderNumber: z.string().min(1, "กรุณาระบุหมายเลขคำสั่งซื้อ"),
  amount: z.number({
    required_error: "กรุณาระบุจำนวนเงิน",
    invalid_type_error: "จำนวนเงินต้องเป็นตัวเลข",
  }).positive("จำนวนเงินต้องมากกว่า 0"),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลแบบ FormData
    const formData = await request.formData();
    
    // แปลงค่าจาก FormData
    const orderNumber = formData.get('orderNumber') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const bankName = "ธนาคารไทยพาณิชย์"; // กำหนดค่าคงที่
    const notes = formData.get('notes') as string || undefined;
    const slipFile = formData.get('slip') as File;
    
    console.log('Received payment confirmation:', {
      orderNumber,
      amount,
      bankName,
      hasSlip: !!slipFile,
    });

    // ตรวจสอบข้อมูลให้ถูกต้องตาม schema
    const validatedData = paymentConfirmationSchema.parse({
      orderNumber,
      amount,
      bankName,
      notes,
    });
    
    // ตรวจสอบไฟล์สลิป
    if (!slipFile) {
      return NextResponse.json({
        success: false,
        message: "กรุณาอัพโหลดหลักฐานการโอนเงิน (สลิป)",
      }, { status: 400 });
    }
    
    // อ่านข้อมูลไฟล์
    const fileBuffer = await slipFile.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    // อัพโหลดไฟล์ไปยัง storage และ resize รูปภาพ
    const slipUrl = await uploadFileToStorage(buffer, slipFile.name);
    
    // ตรวจสอบว่ามีคำสั่งซื้อจริง (optional)
    try {
      const order = await prisma.order.findFirst({
        where: { orderNumber: validatedData.orderNumber }
      });
      
      if (!order) {
        console.warn(`Order not found: ${validatedData.orderNumber}, but still proceeding with payment confirmation`);
      }
    } catch (error) {
      console.warn(`Failed to check order existence: ${error}`);
      // ไม่ทำเป็น error เพราะเราต้องการให้ผู้ใช้แจ้งชำระเงินได้แม้ระบบมีปัญหา
    }
    
    // สร้างวันเวลาปัจจุบันในโซนเวลากรุงเทพฯ
    const bangkokNow = getBangkokDateTime();
    
    // บันทึกข้อมูลลงฐานข้อมูล
    // ใช้ "as any" เพื่อหลีกเลี่ยงปัญหา type error ชั่วคราว
    const paymentConfirmation = await (prisma as any).paymentConfirmation.create({
      data: {
        id: uuidv4(), // ใช้ UUID ตามที่กำหนดในสคีมา
        orderNumber: validatedData.orderNumber,
        amount: new Decimal(validatedData.amount), // แปลงเป็น Decimal
        bankName: validatedData.bankName || '',
        slipUrl: slipUrl,
        status: 'PENDING',
        notes: validatedData.notes,
        createdAt: bangkokNow,
        updatedAt: bangkokNow,
      },
    });
    
    // รีวาลิเดท path เพื่ออัพเดท UI
    revalidatePath('/payment-confirmation');
    revalidatePath('/admin/payment-confirmations');
    
    // ส่งผลลัพธ์กลับไป
    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว เราจะตรวจสอบและดำเนินการโดยเร็วที่สุด",
      data: {
        id: paymentConfirmation.id,
        orderNumber: validatedData.orderNumber,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error processing payment confirmation:", error);
    
    // ถ้าเป็น Zod error จะส่งข้อมูลที่ไม่ผ่านการตรวจสอบกลับไป
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return NextResponse.json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: formattedErrors
      }, { status: 400 });
    }
    
    // ถ้าเป็น error อื่นๆ จะส่ง error ทั่วไปกลับไป
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูลการชำระเงิน",
    }, { status: 500 });
  }
}

export async function GET() {
  // API นี้ใช้สำหรับการสร้างข้อมูลเท่านั้น ไม่สนับสนุน GET
  return NextResponse.json({
    success: false,
    message: "API สำหรับยืนยันการชำระเงิน โปรดใช้ method POST"
  }, { status: 405 });
} 