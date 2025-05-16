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
import { sendDiscordNotification, createPaymentNotificationEmbed } from '@/utils/discordUtils';

// ฟังก์ชันสำหรับอัพโหลดไฟล์ไปยัง storage และ resize ภาพ
async function uploadFileToStorage(file: Buffer, filename: string): Promise<string> {
  try {
    // สร้าง unique filename ด้วย timestamp เพื่อป้องกันการแคช
    const timestamp = Date.now();
    const uniqueFilename = `${uuidv4()}_${timestamp}-${filename}`;
    
    // กำหนดโฟลเดอร์สำหรับเก็บไฟล์ (แยกตาม environment)
    const isProd = process.env.NODE_ENV === 'production';
    const baseDir = isProd ? path.join(process.cwd(), 'uploads') : path.join(process.cwd(), 'public');
    const uploadDir = path.join(baseDir, 'uploads', 'payment-slips');
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
    
    // สร้าง URL สำหรับเรียกใช้ไฟล์ พร้อม query parameter เพื่อป้องกันการแคช
    const fileUrl = `/uploads/payment-slips/${uniqueFilename}?t=${timestamp}`;
    
    // Revalidate path สำหรับรูปที่อัพโหลดใหม่
    revalidatePath('/uploads', 'layout');
    revalidatePath('/uploads/payment-slips', 'layout');
    revalidatePath('/payment-confirmation', 'layout');
    revalidatePath('/admin/payment-confirmations', 'layout');
    revalidatePath('/', 'layout');
    
    //console.log(`Resized and saved image to: ${filePath}`);
    return fileUrl;
  } catch (error) {
    //console.error('Error processing image:', error);
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

// ฟังก์ชันสำหรับสร้าง response headers ที่ป้องกันการ cache
function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };
}

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบว่าเป็น POST request จริงๆ
    if (request.method !== 'POST') {
      return NextResponse.json({
        success: false,
        message: "Method not allowed",
      }, { 
        status: 405,
        headers: getNoCacheHeaders()
      });
    }
    
    // ตรวจสอบว่า request มาจากหน้า payment-confirmation หรือไม่
    const referer = request.headers.get('referer');
    if (!referer || !referer.includes('/payment-confirmation')) {
      return NextResponse.json({
        success: false,
        message: "Invalid request origin",
      }, { 
        status: 403,
        headers: getNoCacheHeaders()
      });
    }
    
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
      }, { 
        status: 400,
        headers: getNoCacheHeaders()
      });
    }
    
    // อ่านข้อมูลไฟล์
    const fileBuffer = await slipFile.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    // อัพโหลดไฟล์ไปยัง storage และ resize รูปภาพ
    const slipUrl = await uploadFileToStorage(buffer, slipFile.name);
    
    // สร้าง absolute URL สำหรับส่งไปยัง Discord
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://treetelu.com';
    const absoluteSlipUrl = slipUrl.startsWith('http') ? slipUrl : `${baseUrl}${slipUrl}`;
    
    //console.log('Absolute slip URL for Discord:', absoluteSlipUrl);
    
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
    
    // ส่งแจ้งเตือนไปยัง Discord พร้อมรูปสลิป
    try {
      // ข้อมูลเกี่ยวกับ path
      //console.log('Current working directory:', process.cwd());
      //console.log('Slip URL from database:', slipUrl);
      //console.log('Full image path:', path.join(process.cwd(), 'public', slipUrl));
      
      // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
      try {
        const fullImagePath = path.join(process.cwd(), 'public', slipUrl);
        const fileExists = fs.existsSync(fullImagePath);
        //console.log('Image file exists:', fileExists);
      } catch (fileCheckError) {
        console.error('Error checking file existence:', fileCheckError);
      }
      
      // สร้าง payload สำหรับส่งไป Discord
      const discordPayload = createPaymentNotificationEmbed({
        orderNumber: validatedData.orderNumber,
        amount: validatedData.amount,
        bankName: validatedData.bankName || 'ธนาคารไทยพาณิชย์',
        slipUrl: absoluteSlipUrl // ใช้ absolute URL
      });
      
      //console.log('Sending Discord notification with payload:', JSON.stringify(discordPayload, null, 2));
      
      // ส่งแจ้งเตือนไปยัง Discord
      await sendDiscordNotification(discordPayload);
      console.log('Discord payment notification sent successfully');
    } catch (discordError) {
      // หากการส่งแจ้งเตือน Discord ล้มเหลว ไม่ให้มีผลต่อการบันทึกข้อมูล
      console.error('Error sending Discord payment notification:', discordError);
    }
    
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
    }, { 
      status: 201,
      headers: getNoCacheHeaders()
    });

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
      }, { 
        status: 400,
        headers: getNoCacheHeaders()
      });
    }
    
    // ถ้าเป็น error อื่นๆ จะส่ง error ทั่วไปกลับไป
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูลการชำระเงิน",
    }, { 
      status: 500,
      headers: getNoCacheHeaders()
    });
  }
}

export async function GET() {
  // API นี้ใช้สำหรับการสร้างข้อมูลเท่านั้น ไม่สนับสนุน GET
  return NextResponse.json({
    success: false,
    message: "API สำหรับยืนยันการชำระเงิน โปรดใช้ method POST"
  }, { 
    status: 405,
    headers: getNoCacheHeaders()
  });
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    console.log('ได้รับคำขอลบข้อมูล payment confirmation ID:', id);

    if (!id) {
      console.log('ไม่พบ ID ในคำขอ');
      return NextResponse.json({ success: false, message: 'ไม่พบ id' }, { status: 400 });
    }

    // ดึงข้อมูล payment-confirmation เพื่อลบไฟล์
    const payment = await prisma.paymentConfirmation.findUnique({
      where: { id: id }
    });

    if (!payment) {
      console.log('ไม่พบข้อมูล payment confirmation สำหรับ ID:', id);
      return NextResponse.json({ success: false, message: 'ไม่พบข้อมูล' }, { status: 404 });
    }

    console.log('พบข้อมูล payment confirmation:', payment);

    // ลบไฟล์รูปภาพถ้ามี
    if (payment.slipUrl) {
      try {
        // แยกเส้นทางไฟล์จาก URL
        let imagePath = payment.slipUrl;
        
        // ตัด query string ออก (เช่น ?t=123456)
        if (imagePath.includes('?')) {
          imagePath = imagePath.split('?')[0];
        }
        
        // กำหนดโฟลเดอร์ตาม environment
        const isProd = process.env.NODE_ENV === 'production';
        
        // ในสภาพแวดล้อม Production
        if (isProd) {
          // เส้นทางเต็มสำหรับไฟล์ใน uploads directory (นอก public)
          const fullImagePath = path.join(process.cwd(), 'uploads', imagePath.replace(/^\/uploads\//, ''));
          console.log('Production - ตรวจสอบไฟล์รูปภาพที่:', fullImagePath);
          
          if (fs.existsSync(fullImagePath)) {
            console.log('พบไฟล์รูปภาพใน uploads directory กำลังลบ...');
            fs.unlinkSync(fullImagePath);
            console.log('ลบไฟล์รูปภาพเรียบร้อย');
          } else {
            console.log('ไม่พบไฟล์รูปภาพใน uploads directory');
          }
        } 
        // ในสภาพแวดล้อม Development
        else {
          // เส้นทางเต็มสำหรับไฟล์ใน public directory
          const fullImagePath = path.join(process.cwd(), 'public', imagePath);
          console.log('Development - ตรวจสอบไฟล์รูปภาพที่:', fullImagePath);
          
          if (fs.existsSync(fullImagePath)) {
            console.log('พบไฟล์รูปภาพใน public directory กำลังลบ...');
            fs.unlinkSync(fullImagePath);
            console.log('ลบไฟล์รูปภาพเรียบร้อย');
          } else {
            console.log('ไม่พบไฟล์รูปภาพใน public directory');
            
            // ลองตรวจสอบใน path อื่นๆ ที่อาจเป็นไปได้
            const alternativePath = path.join(process.cwd(), imagePath);
            console.log('ลองตรวจสอบไฟล์รูปภาพที่ path ทางเลือก:', alternativePath);
            
            if (fs.existsSync(alternativePath)) {
              console.log('พบไฟล์รูปภาพที่ path ทางเลือก กำลังลบ...');
              fs.unlinkSync(alternativePath);
              console.log('ลบไฟล์รูปภาพเรียบร้อย');
            } else {
              console.log('ไม่พบไฟล์รูปภาพที่ path ทางเลือก');
            }
          }
        }
      } catch (fileError) {
        // แสดงข้อผิดพลาดในการลบไฟล์ แต่ไม่ทำให้การลบข้อมูลล้มเหลว
        console.error('เกิดข้อผิดพลาดในการลบไฟล์รูปภาพ:', fileError);
      }
    }

    // ลบข้อมูลในฐานข้อมูล
    console.log('กำลังลบข้อมูลจากฐานข้อมูล...');
    await prisma.paymentConfirmation.delete({
      where: { id: id }
    });
    console.log('ลบข้อมูลจากฐานข้อมูลเรียบร้อย');

    // Revalidate paths เพื่ออัพเดท UI
    revalidatePath('/admin/payment-confirmation');
    revalidatePath('/admin/payment-confirmations');
    revalidatePath('/');

    return NextResponse.json({ 
      success: true, 
      message: 'ลบข้อมูลเรียบร้อย' 
    }, {
      headers: getNoCacheHeaders()
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาด', 
      error: String(error) 
    }, { 
      status: 500,
      headers: getNoCacheHeaders()
    });
  }
} 