import { NextResponse } from 'next/server';
import { sendDiscordNotification, createOrderNotificationEmbed } from '@/utils/discordUtils';
import { getBangkokDateTime } from '@/utils/dateUtils';

/**
 * API endpoint สำหรับทดสอบการส่ง Discord notification
 */
export async function GET(request: Request) {
  try {
    // แสดงข้อมูล webhook URL (เซ็นเซอร์บางส่วน)
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    const urlInfo = {
      masked: webhookUrl.length > 0 
        ? `${webhookUrl.substring(0, 10)}...${webhookUrl.substring(webhookUrl.length - 5)}` 
        : 'ไม่พบ URL',
      length: webhookUrl.length,
      startsWithHttps: webhookUrl.startsWith('https://'),
      isSet: webhookUrl.length > 0
    };

    console.log('Testing Discord webhook:', urlInfo);

    // ทดสอบส่งข้อความธรรมดา
    console.log('Sending simple message...');
    const simpleResult = await sendDiscordNotification('🧪 **ทดสอบการส่งแจ้งเตือน** - นี่เป็นข้อความทดสอบจากระบบ TreeTelu - ' + new Date().toLocaleString());
    console.log('Simple message result:', simpleResult ? 'success' : 'failed');
    
    // ทดสอบส่ง embed
    console.log('Sending embed message...');
    const embedResult = await sendDiscordNotification({
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
              value: getBangkokDateTime().toLocaleString('th-TH'),
              inline: true
            },
            {
              name: '🔗 Webhook URL',
              value: urlInfo.isSet ? 'กำหนดแล้ว (' + urlInfo.length + ' อักขระ)' : 'ไม่ได้กำหนด',
              inline: true
            }
          ],
          timestamp: getBangkokDateTime().toISOString(),
          footer: {
            text: 'TreeTelu Test System'
          }
        }
      ]
    });
    console.log('Embed message result:', embedResult ? 'success' : 'failed');

    // ทดสอบสร้าง mock order data และใช้ createOrderNotificationEmbed
    const mockOrderData = {
      id: 12345,
      orderNumber: 'TEST12345',
      totalAmount: 1200,
      discount: 100,
      finalAmount: 1100,
      paymentMethod: 'PROMPTPAY',
      stripePaymentMethodType: 'promptpay',
      items: [
        {
          productId: 1,
          productName: 'ต้นไม้ทดสอบ',
          quantity: 2,
          unitPrice: 500
        },
        {
          productId: 2,
          productName: 'กระถางทดสอบ',
          quantity: 1,
          unitPrice: 200
        }
      ],
      customerInfo: {
        firstName: 'ทดสอบ',
        lastName: 'ส่งข้อความ',
        email: 'test@example.com',
        phone: '0812345678'
      },
      shippingInfo: {
        receiverName: 'ผู้รับ',
        receiverLastname: 'ทดสอบ',
        receiverPhone: '0812345678',
        addressLine: '123 ถนนทดสอบ',
        tambonName: 'ตำบลทดสอบ',
        amphureName: 'อำเภอทดสอบ',
        provinceName: 'จังหวัดทดสอบ',
        zipCode: '12345'
      }
    };

    console.log('Sending order notification...');
    const orderEmbed = createOrderNotificationEmbed(mockOrderData);
    const orderNotificationResult = await sendDiscordNotification(orderEmbed);
    console.log('Order notification result:', orderNotificationResult ? 'success' : 'failed');

    return NextResponse.json({
      success: true,
      webhookUrl: urlInfo,
      results: {
        simpleMessage: simpleResult !== null,
        embed: embedResult !== null,
        orderNotification: orderNotificationResult !== null
      },
      // คำแนะนำในการแก้ไขปัญหา
      troubleshooting: {
        checkDotEnv: "ตรวจสอบไฟล์ .env ว่ามี DISCORD_WEBHOOK_URL ที่ถูกต้องหรือไม่",
        validFormat: "URL ควรอยู่ในรูปแบบ https://discord.com/api/webhooks/[webhook_id]/[webhook_token]",
        restart: "ลองรีสตาร์ทเซิร์ฟเวอร์หลังจากแก้ไข .env",
        testHere: "ทดสอบการทำงานของ webhook โดยเรียกใช้ API นี้อีกครั้ง"
      },
      message: `การทดสอบเสร็จสิ้น: ข้อความธรรมดา ${simpleResult !== null ? 'สำเร็จ' : 'ล้มเหลว'}, Embed ${embedResult !== null ? 'สำเร็จ' : 'ล้มเหลว'}, Order Notification ${orderNotificationResult !== null ? 'สำเร็จ' : 'ล้มเหลว'}`
    });
  } catch (error) {
    console.error('Error in test discord endpoint:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการทดสอบ Discord',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 