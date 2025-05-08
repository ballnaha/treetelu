import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, name, email, phone } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'จำนวนเงินไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // สร้าง Omise instance
    const omise = require('omise')({
      publicKey: process.env.OMISE_PUBLIC_KEY,
      secretKey: process.env.OMISE_SECRET_KEY,
    });

    // สร้าง unique reference ID สำหรับธุรกรรมนี้
    const referenceId = `pp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // สร้าง charge แทนที่จะสร้าง source อย่างเดียว
    // เพราะเฉพาะตอนสร้าง charge เท่านั้นที่จะได้ QR code
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100), // แปลงเป็นสตางค์ (เช่น 1,000 บาท = 100,000 สตางค์)
      currency: 'thb',
      return_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/orders/complete?source=pp&transactionId=${referenceId}`,
      metadata: {
        ref_id: referenceId,
        order_id: 'pending', // จะอัพเดทเป็นเลข order id จริงเมื่อมีการสร้าง order
        customer_email: email || '',
        customer_name: name || '',
        customer_phone: phone || '',
        webhook_endpoint: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/api/webhook/omise`,
        event_type: 'source.complete'
      },
      source: {
        type: 'promptpay'
      }
    });

    // อัพเดท return_uri หลังจากได้ charge.id แล้ว
    try {
      await omise.charges.update(charge.id, {
        return_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/orders/complete?source=pp&transactionId=${charge.id}`
      });
      console.log('Updated return_uri with charge.id:', charge.id);
    } catch (updateError) {
      console.error('Failed to update return_uri:', updateError);
      // ไม่หยุดกระบวนการเนื่องจากอาจไม่ใช่ข้อผิดพลาดที่ทำให้ระบบหยุดทำงาน
    }

    // Debug: ตรวจสอบข้อมูล charge ที่ได้รับจาก Omise
    console.log('Omise charge response:', JSON.stringify(charge, null, 2));

    // ตรวจสอบอย่างละเอียดว่ามี scannable_code ใน source หรือไม่
    if (!charge || !charge.source) {
      console.error('ไม่พบข้อมูล source ใน charge response:', JSON.stringify(charge, null, 2));
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่สามารถสร้าง source สำหรับ PromptPay ได้' 
        },
        { status: 500 }
      );
    }

    if (!charge.source.scannable_code) {
      console.error('ไม่พบ scannable_code ใน source:', JSON.stringify(charge.source, null, 2));
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่พบ QR code ใน response' 
        },
        { status: 500 }
      );
    }

    if (!charge.source.scannable_code.image || !charge.source.scannable_code.image.download_uri) {
      console.error('ไม่พบ QR code image URL:', JSON.stringify(charge.source.scannable_code, null, 2));
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'ไม่สามารถสร้าง QR code สำหรับ PromptPay ได้' 
        },
        { status: 500 }
      );
    }

    // แสดงข้อมูล QR code path ที่จะส่งกลับไปให้ client
    const qrCodeUrl = charge.source.scannable_code.image.download_uri;
    console.log('QR code path:', qrCodeUrl);

    // ส่งคืนข้อมูลที่จำเป็นสำหรับแสดง QR code และทำการชำระเงิน
    return NextResponse.json({
      success: true,
      source: {
        id: charge.id, // ใช้ charge.id แทน source.id
        qrCode: qrCodeUrl, // URL ของ QR code
        return_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://treetelu.com'}/orders/complete?source=pp&transactionId=${charge.id}`
      },
      charge: {
        id: charge.id // charge id สำหรับติดตามสถานะการชำระเงิน
      },
      reference: referenceId
    });
  } catch (error) {
    console.error('Error creating PromptPay QR code:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error 
          ? `เกิดข้อผิดพลาด: ${error.message}` 
          : 'เกิดข้อผิดพลาดในการสร้าง PromptPay QR code'
      },
      { status: 500 }
    );
  }
} 