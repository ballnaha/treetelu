import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'TreeTelu <no-reply@treetelu.com>',
      to: 'info@treetelu.com',
      subject: `ข้อความติดต่อจาก ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea;">
          <h2 style="color: #2e7d32; margin-bottom: 20px;">ข้อความติดต่อใหม่</h2>
          <p><strong>ชื่อ:</strong> ${name}</p>
          <p><strong>อีเมล:</strong> ${email}</p>
          ${phone ? `<p><strong>เบอร์โทรศัพท์:</strong> ${phone}</p>` : ''}
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #2e7d32;">
            <p style="margin: 0;"><strong>ข้อความ:</strong></p>
            <p style="white-space: pre-line; margin-top: 10px;">${message}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'ส่งข้อความเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็วที่สุด' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผลแบบฟอร์ม กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
