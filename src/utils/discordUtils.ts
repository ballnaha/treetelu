/**
 * Utility functions สำหรับการส่งข้อความแจ้งเตือนไปยัง Discord
 */
import { getBangkokDateTime } from './dateUtils';
import { calculateShippingCost } from './shippingUtils';

/**
 * ส่งข้อความแจ้งเตือนไปยัง Discord webhook
 * @param message ข้อความหรือ embed ที่จะส่งไปยัง Discord
 * @param webhookUrl URL ของ Discord webhook
 * @param debugInfo ข้อมูลสำหรับการ debug เพิ่มเติม (optional)
 * @returns Promise ที่จะ resolve เมื่อส่งข้อความสำเร็จ
 */
export async function sendDiscordNotification(
  message: string | object,
  webhookUrl = process.env.DISCORD_WEBHOOK_URL,
  debugInfo: Record<string, any> = {}
): Promise<Response | null> {
  try {
    // ตรวจสอบว่า webhookUrl ถูกกำหนดและมีรูปแบบที่ถูกต้อง
    if (!webhookUrl) {
      console.error('Discord webhook URL is not defined in environment variables');
      return null; // คืนค่า null แทนที่จะโยน error
    }

    // ตรวจสอบว่า webhookUrl เป็น URL ที่ถูกต้องหรือไม่
    if (!webhookUrl.startsWith('http')) {
      console.error('Invalid Discord webhook URL format:', webhookUrl);
      return null;
    }

    // สร้าง body ของ request
    let body: any;
    
    if (typeof message === 'string') {
      // ถ้าเป็น string จะส่งเป็นข้อความธรรมดา
      body = {
        content: message,
      };
    } else {
      // ถ้าเป็น object จะส่งเป็น embed
      body = message;
    }

    // เพิ่มข้อมูล timestamp เพื่อป้องกันการส่งซ้ำ
    // ใช้ ISO string ตามมาตรฐาน Discord เพื่อให้แสดงเวลาถูกต้อง
    // Discord ใช้ ISO8601 ซึ่งจะแปลงเป็นเวลาตาม timezone ของผู้ใช้โดยอัตโนมัติ
    const now = new Date();
    const timestamp = now.toISOString();
    
    if (body.embeds && Array.isArray(body.embeds) && body.embeds.length > 0) {
      // ถ้ามี embeds ให้กำหนด timestamp ให้กับทุก embed
      body.embeds = body.embeds.map((embed: any) => ({
        ...embed,
        timestamp: timestamp
      }));
    }

    // Log ข้อมูลที่จะส่งไป Discord
    console.log('Sending Discord notification with data:', JSON.stringify({
      ...debugInfo,
      webhookUrlValid: !!webhookUrl,
      webhookUrlLength: webhookUrl?.length || 0,
      messageType: typeof message,
      hasEmbeds: !!body.embeds,
      embeds: body.embeds ? body.embeds.length : 0,
      timestamp: timestamp
    }, null, 2));

    // ส่ง request ไปยัง Discord webhook โดยกำหนด timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // timeout 10 วินาที

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discord webhook error:', response.status, errorText);
        return null; // คืนค่า null แทนที่จะโยน error
      }
      
      console.log('Discord notification sent successfully');
      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Error fetching Discord webhook:', fetchError);
      return null; // คืนค่า null แทนที่จะโยน error
    }
  } catch (error) {
    console.error('Error in sendDiscordNotification:', error);
    return null; // คืนค่า null แทนที่จะโยน error
  }
}

/**
 * สร้าง embed สำหรับแจ้งเตือนคำสั่งซื้อใหม่
 * @param orderData ข้อมูลคำสั่งซื้อ
 * @returns Discord embed object
 */
export async function createOrderNotificationEmbed(orderData: any) {
  console.log('Creating order notification embed with data:', JSON.stringify({
    orderNumber: orderData?.orderNumber,
    paymentMethod: orderData?.paymentMethod,
    customerInfo: orderData?.customerInfo,
    hasItems: !!orderData?.items,
    itemsLength: orderData?.items?.length
  }, null, 2));

  // ตรวจสอบว่ามีข้อมูล items หรือไม่ และป้องกัน error
  if (!orderData || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    console.warn('Invalid or missing items in order data for Discord notification');
    
    // สร้าง embed อย่างง่ายในกรณีไม่มีข้อมูล items
    return {
      embeds: [
        {
          title: `📦 คำสั่งซื้อใหม่ ${orderData?.orderNumber ? `#${orderData.orderNumber}` : ''}`,
          color: 0x24B493,
          description: 'มีคำสั่งซื้อใหม่ แต่ไม่สามารถแสดงรายละเอียดได้เนื่องจากข้อมูลไม่ครบถ้วน',
          timestamp: new Date().toISOString(),
          footer: {
            text: 'TreeTelu Order System'
          }
        }
      ]
    };
  }
  
  try {
    // คำนวณราคารวมทั้งหมด
    const subtotal = Number(orderData.items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0));
    
    // คำนวณค่าจัดส่งจากการตั้งค่าในฐานข้อมูล
    const shippingCost = await calculateShippingCost(subtotal);
    
    // คำนวณส่วนลด (ถ้ามี)
    const discount = Number(orderData.discount || 0);
    
    // คำนวณยอดรวมสุทธิ
    const totalAmount = subtotal + shippingCost - discount;

    // ตรวจสอบข้อมูลลูกค้า
    const customerInfo = orderData.customerInfo || {};
    const customerName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'ไม่ระบุ';
    const customerEmail = customerInfo.email || 'ไม่ระบุ';
    const customerPhone = customerInfo.phone || 'ไม่ระบุ';

    // ตรวจสอบข้อมูลการจัดส่ง
    const shippingInfo = orderData.shippingInfo || {};
    const receiverName = `${shippingInfo.receiverName || ''} ${shippingInfo.receiverLastname || ''}`.trim() || 'ไม่ระบุ';
    const receiverPhone = shippingInfo.receiverPhone || 'ไม่ระบุ';
    const addressLine = shippingInfo.addressLine || '';
    const tambonName = shippingInfo.tambonName || '';
    const amphureName = shippingInfo.amphureName || '';
    const provinceName = shippingInfo.provinceName || '';
    const zipCode = shippingInfo.zipCode || '';
    
    // ตรวจสอบว่าเป็นการจัดส่งให้ผู้อื่นหรือไม่
    const isShippingToOthers = shippingInfo.shippingType === 'OTHER';
    
    let fullAddress = '';
    if (isShippingToOthers) {
      // กรณีจัดส่งให้ผู้อื่น แสดงเฉพาะที่อยู่ที่กรอกมา
      fullAddress = addressLine || 'ไม่ระบุ';
    } else {
      // กรณีจัดส่งให้ตัวเอง แสดงที่อยู่เต็ม
      fullAddress = `${addressLine} ${tambonName} ${amphureName} ${provinceName} ${zipCode}`.trim() || 'ไม่ระบุ';
    }

    // สร้างรายการสินค้า
    let itemsField = '';
    try {
      itemsField = orderData.items.map((item: any, index: number) => {
        const productName = item.productName || `สินค้า #${item.productId || index + 1}`;
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        return `${index + 1}. ${productName} x${quantity} (${unitPrice.toLocaleString()} บาท/ชิ้น)`;
      }).join('\n');
    } catch (error) {
      console.error('Error generating items field for Discord notification:', error);
      itemsField = 'ไม่สามารถแสดงรายการสินค้าได้';
    }

    // สร้าง embed
    return {
      embeds: [
        {
          title: `📦 คำสั่งซื้อใหม่ #${orderData.orderNumber || 'ไม่ระบุ'}`,
          color: 0x24B493, // สีเขียวของ TreeTelu
          fields: [
            {
              name: '👤 ข้อมูลลูกค้า',
              value: `**ชื่อ:** ${customerName}\n**อีเมล:** ${customerEmail}\n**โทร:** ${customerPhone}`,
              inline: false
            },
            {
              name: '🛒 รายการสินค้า',
              value: itemsField || 'ไม่มีรายการสินค้า',
              inline: false
            },
            {
              name: '💰 ยอดรวม',
              value: `**สินค้า:** ${subtotal.toLocaleString()} บาท\n**ค่าจัดส่ง:** ${shippingCost === 0 ? 'ฟรี' : `${shippingCost.toLocaleString()} บาท`}${discount > 0 ? `\n**ส่วนลด${orderData.discountCode ? ` (${orderData.discountCode})` : ''}:** -${discount.toLocaleString()} บาท` : ''}\n**รวมทั้งสิ้น:** ${totalAmount.toLocaleString()} บาท`,
              inline: true
            },
            {
              name: '💳 วิธีการชำระเงิน',
              value: getPaymentMethodThai(orderData.paymentMethod || 'ไม่ระบุ'),
              inline: true
            },
            {
              name: '🚚 ที่อยู่จัดส่ง',
              value: `**ผู้รับ:** ${receiverName}\n**โทร:** ${receiverPhone}\n**ที่อยู่:** ${fullAddress}`,
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'TreeTelu Order System'
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error creating order notification embed:', error);
    // ส่งข้อความแจ้งเตือนอย่างง่ายในกรณีเกิด error
    return {
      embeds: [
        {
          title: `📦 คำสั่งซื้อใหม่ ${orderData?.orderNumber ? `#${orderData.orderNumber}` : ''}`,
          color: 0xFF0000, // สีแดง
          description: 'มีคำสั่งซื้อใหม่ แต่เกิดข้อผิดพลาดในการแสดงรายละเอียด กรุณาตรวจสอบในระบบ',
          timestamp: new Date().toISOString(),
          footer: {
            text: 'TreeTelu Order System'
          }
        }
      ]
    };
  }
}

/**
 * แปลวิธีการชำระเงินเป็นภาษาไทย
 * @param paymentMethod รหัสวิธีการชำระเงิน
 * @returns ชื่อวิธีการชำระเงินเป็นภาษาไทย
 */
function getPaymentMethodThai(paymentMethod: string): string {
  switch (paymentMethod) {
    case 'BANK_TRANSFER': 
      return 'โอนเงินผ่านธนาคาร';
    case 'CREDIT_CARD': 
      return 'บัตรเครดิต/เดบิต';
    case 'PROMPTPAY': 
      return 'พร้อมเพย์';
    case 'COD': 
      return 'เก็บเงินปลายทาง';
    default: 
      return paymentMethod;
  }
}

/**
 * สร้าง embed สำหรับแจ้งเตือนการชำระเงิน
 * @param paymentData ข้อมูลการชำระเงิน
 * @returns Discord embed object
 */
export function createPaymentNotificationEmbed(paymentData: any) {
  console.log('Creating payment notification embed with data:', JSON.stringify(paymentData, null, 2));
  
  // กำหนด base URL ที่สามารถเข้าถึงได้จากภายนอก
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // สร้าง URL เต็มของรูปภาพสลิป
  let slipImageUrl = '';
  
  // ตรวจสอบว่ามี slipUrl หรือไม่
  if (paymentData.slipUrl) {
    // ตรวจสอบว่า URL เริ่มต้นด้วย http หรือไม่
    if (paymentData.slipUrl.startsWith('http')) {
      slipImageUrl = paymentData.slipUrl;
    } else {
      // ทำ URL ให้เป็น absolute URL โดยเชื่อมต่อกับ baseUrl
      // ตรวจสอบว่า slipUrl เริ่มต้นด้วย / หรือไม่
      const slipPath = paymentData.slipUrl.startsWith('/') 
        ? paymentData.slipUrl 
        : `/${paymentData.slipUrl}`;
      
      slipImageUrl = `${baseUrl}${slipPath}`;
    }
    
    console.log('Discord payment notification image URL:', slipImageUrl);
  } else {
    console.warn('No slip image URL provided in payment data');
  }
  
  // สร้าง embed object
  const embed = {
    title: `💸 แจ้งชำระเงินใหม่`,
    color: 0x4CC9AD, // สีเขียวอ่อนของ TreeTelu
    fields: [
      {
        name: '📝 ข้อมูลการชำระเงิน',
        value: `**หมายเลขคำสั่งซื้อ:** ${paymentData.orderNumber}\n**จำนวนเงิน:** ${Number(paymentData.amount).toLocaleString()} บาท\n**ธนาคาร:** ${paymentData.bankName || 'ธนาคารไทยพาณิชย์'}`,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'TreeTelu Payment System'
    }
  };
  
  // เพิ่ม image URL เฉพาะเมื่อมี slipImageUrl
  if (slipImageUrl) {
    // @ts-ignore
     embed.image = { url: slipImageUrl };

     // ทดสอบรูปภาพ mockup
    //embed.image = { url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png' };
  }
  
  // สร้าง embed
  return {
    embeds: [embed]
  };
} 