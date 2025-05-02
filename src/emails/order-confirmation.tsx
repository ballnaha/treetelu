import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from '@react-email/components';
import { formatThaiCurrency } from '@/utils/currencyUtils';

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  shippingCost: number;
  finalAmount: number;
}

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  items,
  totalAmount,
  shippingCost,
  finalAmount,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>ขอบคุณสำหรับคำสั่งซื้อ #{orderNumber}</Preview>
      <Body style={main}>
        <Container>
          <Heading style={h1}>ขอบคุณสำหรับคำสั่งซื้อของคุณ</Heading>
          
          <Text style={text}>เรียน คุณ{customerName}</Text>
          
          <Text style={text}>
            ขอบคุณที่ไว้วางใจเลือกซื้อสินค้ากับเรา เราได้รับคำสั่งซื้อหมายเลข #{orderNumber} ของคุณแล้ว
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>รายการสินค้า</Heading>
            
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                  <Text style={itemText}>
                    {item.productName} x {item.quantity}
                  </Text>
                </Column>
                <Column>
                  <Text style={itemPrice}>
                    ฿{formatThaiCurrency(item.unitPrice * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Row style={totalRow}>
              <Column>
                <Text style={totalText}>รวมค่าสินค้า</Text>
              </Column>
              <Column>
                <Text style={totalPrice}>฿{formatThaiCurrency(totalAmount)}</Text>
              </Column>
            </Row>

            <Row style={totalRow}>
              <Column>
                <Text style={totalText}>ค่าจัดส่ง</Text>
              </Column>
              <Column>
                <Text style={totalPrice}>฿{formatThaiCurrency(shippingCost)}</Text>
              </Column>
            </Row>

            <Row style={grandTotalRow}>
              <Column>
                <Text style={grandTotalText}>ยอดรวมทั้งสิ้น</Text>
              </Column>
              <Column>
                <Text style={grandTotalPrice}>฿{formatThaiCurrency(finalAmount)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>ขั้นตอนต่อไป</Heading>
            <Text style={text}>
              กรุณาชำระเงินภายใน 24 ชั่วโมง โดยโอนเงินมาที่บัญชี:
            </Text>
            <Text style={bankInfo}>
              ธนาคารไทยพาณิชย์ (SCB)<br />
              เลขที่บัญชี: 264-221037-2<br />
              ชื่อบัญชี: นาย ธัญญา รัตนาวงศ์ไชยา<br />
              
            </Text>
            <Text style={text}>
              หลังจากชำระเงินแล้ว กรุณาแจ้งการชำระเงินที่หน้าเว็บไซต์ของเรา พร้อมแนบหลักฐานการโอนเงิน
            </Text>
          </Section>

          <Text style={footer}>
            หากคุณมีคำถามใดๆ สามารถติดต่อเราได้ที่ Line: @095xrokt
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const h1 = {
  color: '#24B493',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '16px 0',
};

const h2 = {
  color: '#24B493',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '12px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const section = {
  margin: '24px 0',
};

const itemRow = {
  margin: '8px 0',
};

const itemText = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
};

const itemPrice = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
  textAlign: 'right' as const,
};

const totalRow = {
  borderTop: '1px solid #eee',
  margin: '8px 0',
  paddingTop: '8px',
};

const totalText = {
  color: '#666',
  fontSize: '16px',
  margin: '0',
};

const totalPrice = {
  color: '#666',
  fontSize: '16px',
  margin: '0',
  textAlign: 'right' as const,
};

const grandTotalRow = {
  borderTop: '2px solid #24B493',
  margin: '16px 0',
  paddingTop: '16px',
};

const grandTotalText = {
  color: '#24B493',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const grandTotalPrice = {
  color: '#24B493',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'right' as const,
};

const bankInfo = {
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '16px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '32px 0 16px',
  textAlign: 'center' as const,
};

export default OrderConfirmationEmail; 