import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAdminUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// สร้าง schema สำหรับตรวจสอบข้อมูล
const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

// GET /api/admin/payment-confirmation
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const { isAdmin, error } = await validateAdminUser(request as any);
    if (!isAdmin) {
      return NextResponse.json(
        { message: error || 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // ดึงข้อมูลการชำระเงินทั้งหมด
    const payments = await prisma.paymentConfirmation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        orderNumber: true,
        amount: true,
        slipUrl: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payment confirmations:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/payment-confirmation/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const { isAdmin, error } = await validateAdminUser(request as any);
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

    // อัพเดทข้อมูลการชำระเงิน
    const updatedPayment = await prisma.paymentConfirmation.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        updatedAt: new Date(),
      },
    });

    // รีแวลิดเดท path เพื่อให้ข้อมูลอัพเดท
    revalidatePath('/admin/payment-confirmation');

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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ admin
    const { isAdmin, error } = await validateAdminUser(request as any);
    if (!isAdmin) {
      return NextResponse.json(
        { message: error || 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const id = params.id;

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