import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAdminUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// สร้าง schema สำหรับตรวจสอบข้อมูล
const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']),
  notes: z.string().optional(),
});

// PATCH /api/admin/payment-confirmation/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const { isAdmin, error } = await validateAdminUser(request);
    if (!isAdmin) {
      return NextResponse.json(
        { message: error || 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const id = params.id;
    const body = await request.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    const validatedData = updatePaymentSchema.parse(body);

    // ตรวจสอบว่ามีข้อมูลการชำระเงินนี้อยู่หรือไม่
    const existingPayment = await prisma.paymentConfirmation.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลการชำระเงิน' },
        { status: 404 }
      );
    }

    // อัพเดทข้อมูลการชำระเงิน
    const updatedPayment = await prisma.paymentConfirmation.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
    });

    // ถ้าสถานะเป็น CONFIRMED ให้อัพเดทสถานะใน orders table ด้วย
    if (validatedData.status === 'CONFIRMED') {
      try {
        // ค้นหา order ที่ตรงกับ orderNumber
        const order = await prisma.order.findFirst({
          where: { orderNumber: existingPayment.orderNumber },
        });

        if (order) {
          // อัพเดทสถานะการชำระเงินใน orders table
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'CONFIRMED' },
          });

          // อัพเดทสถานะใน payment_info table ถ้ามี
          const paymentInfo = await prisma.paymentInfo.findUnique({
            where: { orderId: order.id },
          });

          if (paymentInfo) {
            await prisma.paymentInfo.update({
              where: { orderId: order.id },
              data: {
                status: 'CONFIRMED',
                paymentDate: new Date(),
              },
            });
          }
        }
      } catch (orderUpdateError) {
        console.error('Error updating order payment status:', orderUpdateError);
        // ไม่ให้ error นี้ทำให้การอัพเดท payment confirmation ล้มเหลว
      }
    }

    // รีแวลิดเดท path เพื่อให้ข้อมูลอัพเดท
    revalidatePath('/admin/payment-confirmation');
    revalidatePath('/admin/orders');

    return NextResponse.json({
      message: 'อัพเดทข้อมูลสำเร็จ',
      payment: updatedPayment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ถูกต้อง', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating payment confirmation:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-confirmation/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const { isAdmin, error } = await validateAdminUser(request);
    if (!isAdmin) {
      return NextResponse.json(
        { message: error || 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const id = params.id;

    // ตรวจสอบว่ามีข้อมูลการชำระเงินนี้อยู่หรือไม่
    const existingPayment = await prisma.paymentConfirmation.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { message: 'ไม่พบข้อมูลการชำระเงิน' },
        { status: 404 }
      );
    }

    // ลบข้อมูลการชำระเงิน
    await prisma.paymentConfirmation.delete({
      where: { id },
    });

    // รีแวลิดเดท path เพื่อให้ข้อมูลอัพเดท
    revalidatePath('/admin/payment-confirmation');

    return NextResponse.json({
      message: 'ลบข้อมูลสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting payment confirmation:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการลบข้อมูล' },
      { status: 500 }
    );
  }
}