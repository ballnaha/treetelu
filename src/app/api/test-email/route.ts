import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// ตั้งค่า SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// รายการอีเมลที่ยืนยันแล้ว (ตัวอย่าง)
const VERIFIED_EMAILS = [
  // เพิ่มอีเมลที่คุณยืนยันแล้วในนี้
  'l3onsaiii1@gmail.com'
];

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'กรุณาระบุอีเมล' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าอีเมลได้รับการยืนยันแล้ว
    if (!VERIFIED_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'กรุณายืนยันอีเมลใน SendGrid ก่อนทดสอบการส่ง' },
        { status: 400 }
      );
    }

    // สร้าง email template
    const msg = {
      to: email,
      from: 'l3onsaiii1@gmail.com', // ต้องเป็นอีเมลที่ยืนยันใน SendGrid
      subject: 'ทดสอบการส่งอีเมลจาก Tree True',
      text: 'นี่คืออีเมลทดสอบ',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #24B493;">ขอบคุณสำหรับคำสั่งซื้อ</h1>
          
          <div style="margin: 20px 0;">
            <h2>รายการสินค้าทดสอบ</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td>สินค้าทดสอบ x 1</td>
                <td style="text-align: right;">฿100.00</td>
              </tr>
              <tr style="border-top: 1px solid #eee;">
                <td>ค่าจัดส่ง</td>
                <td style="text-align: right;">฿0.00</td>
              </tr>
              <tr style="border-top: 2px solid #24B493; font-weight: bold;">
                <td>รวมทั้งสิ้น</td>
                <td style="text-align: right;">฿100.00</td>
              </tr>
            </table>
          </div>

          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">ข้อมูลการชำระเงิน</h3>
            <p>
              ธนาคารไทยพาณิชย์ (SCB)<br>
              เลขที่บัญชี: 123-4-56789-0<br>
              ชื่อบัญชี: บริษัท ทรีเทลู จำกัด<br>
              
            </p>
          </div>

          <p style="color: #666; font-style: italic; text-align: center;">
            หากมีคำถามกรุณาติดต่อ support@treetrue.com
          </p>
        </div>
      `,
    };

    // ส่งอีเมล
    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: 'ส่งอีเมลสำเร็จ'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งอีเมล' },
      { status: 500 }
    );
  }
} 