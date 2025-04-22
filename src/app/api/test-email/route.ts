import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { sendDiscordNotification } from '@/utils/discordUtils';

// ตั้งค่า SendGrid API Key
//sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// รายการอีเมลที่ยืนยันแล้ว (ตัวอย่าง)
const VERIFIED_EMAILS = [
  // เพิ่มอีเมลที่คุณยืนยันแล้วในนี้
  'treetelunoreply@gmail.com'
];

export async function POST(request: Request) {
  try {
    const { email, testDiscord = true } = await request.json();

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
      from: 'treetelunoreply@gmail.com', // ต้องเป็นอีเมลที่ยืนยันใน SendGrid
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

    const results = {
      email: false,
      discord: false
    };

    // ส่งอีเมล
    try {
      await sgMail.send(msg);
      results.email = true;
    } catch (emailError) {
      console.error('Error sending test email:', emailError);
      results.email = false;
    }

    // ส่งแจ้งเตือนไปยัง Discord
    if (testDiscord) {
      try {
        // ทดสอบส่งข้อความธรรมดา
        await sendDiscordNotification('🧪 **ทดสอบการส่งแจ้งเตือน** - นี่เป็นข้อความทดสอบจากระบบ TreeTelu');
        
        // ทดสอบส่ง embed
        await sendDiscordNotification({
          embeds: [
            {
              title: '🧪 ทดสอบการส่งแจ้งเตือน',
              description: 'นี่เป็นข้อความทดสอบจากระบบ TreeTelu',
              color: 0x24B493, // สีเขียวของ TreeTelu
              fields: [
                {
                  name: '📝 ข้อมูลทดสอบ',
                  value: 'ทดสอบการส่งข้อความแจ้งเตือนไปยัง Discord',
                  inline: false
                },
                {
                  name: '⏰ เวลา',
                  value: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
                  inline: true
                }
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: 'TreeTelu Test System'
              }
            }
          ]
        });
        results.discord = true;
      } catch (discordError) {
        console.error('Error sending Discord notification:', discordError);
        results.discord = false;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `การทดสอบเสร็จสิ้น: อีเมล ${results.email ? 'สำเร็จ' : 'ล้มเหลว'}, Discord ${testDiscord ? (results.discord ? 'สำเร็จ' : 'ล้มเหลว') : 'ไม่ได้ทดสอบ'}`
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการทดสอบ' },
      { status: 500 }
    );
  }
} 