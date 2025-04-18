/**
 * Utility functions สำหรับการส่งข้อความแจ้งเตือนไปยัง Discord
 */

/**
 * ส่งข้อความแจ้งเตือนไปยัง Discord webhook
 * @param message ข้อความหรือ embed ที่จะส่งไปยัง Discord
 * @param webhookUrl URL ของ Discord webhook
 * @returns Promise ที่จะ resolve เมื่อส่งข้อความสำเร็จ
 */
export async function sendDiscordNotification(
  message: string | object,
  webhookUrl = process.env.DISCORD_WEBHOOK_URL
): Promise<Response> {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is not defined in environment variables');
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

  // ส่ง request ไปยัง Discord webhook
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * สร้าง embed สำหรับแจ้งเตือนคำสั่งซื้อใหม่
 * @param orderData ข้อมูลคำสั่งซื้อ
 * @returns Discord embed object
 */
export function createOrderNotificationEmbed(orderData: any) {
  // คำนวณราคารวมทั้งหมด
  const subtotal = Number(orderData.items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0));
  
  // คำนวณค่าจัดส่ง: ฟรีค่าจัดส่งเมื่อซื้อสินค้ามากกว่าหรือเท่ากับ 1,500 บาท
  const shippingCost = subtotal >= 1500 ? 0 : 100;
  const totalAmount = subtotal + shippingCost;

  // สร้างรายการสินค้า
  const itemsField = orderData.items.map((item: any, index: number) => {
    return `${index + 1}. ${item.productName} x${item.quantity} (${Number(item.unitPrice).toLocaleString()} บาท/ชิ้น)`;
  }).join('\n');

  // สร้าง embed
  return {
    embeds: [
      {
        title: `📦 คำสั่งซื้อใหม่ #${orderData.orderNumber}`,
        color: 0x24B493, // สีเขียวของ TreeTelu
        fields: [
          {
            name: '👤 ข้อมูลลูกค้า',
            value: `**ชื่อ:** ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}\n**อีเมล:** ${orderData.customerInfo.email}\n**โทร:** ${orderData.customerInfo.phone}`,
            inline: false
          },
          {
            name: '🛒 รายการสินค้า',
            value: itemsField,
            inline: false
          },
          {
            name: '💰 ยอดรวม',
            value: `**สินค้า:** ${subtotal.toLocaleString()} บาท\n**ค่าจัดส่ง:** ${shippingCost === 0 ? 'ฟรี' : `${shippingCost.toLocaleString()} บาท`}\n**รวมทั้งสิ้น:** ${totalAmount.toLocaleString()} บาท`,
            inline: true
          },
          {
            name: '💳 วิธีการชำระเงิน',
            value: getPaymentMethodThai(orderData.paymentMethod),
            inline: true
          },
          {
            name: '🚚 ที่อยู่จัดส่ง',
            value: `**ผู้รับ:** ${orderData.shippingInfo.receiverName} ${orderData.shippingInfo.receiverLastname}\n**โทร:** ${orderData.shippingInfo.receiverPhone}\n**ที่อยู่:** ${orderData.shippingInfo.addressLine} ${orderData.shippingInfo.tambonName} ${orderData.shippingInfo.amphureName} ${orderData.shippingInfo.provinceName} ${orderData.shippingInfo.zipCode}`,
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