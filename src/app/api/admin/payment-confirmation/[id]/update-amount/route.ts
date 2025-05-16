import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAdminUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// สร้าง schema สำหรับตรวจสอบข้อมูล
const updateAmountSchema = z.object({
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
});

// PATCH /api/admin/payment-confirmation/[id]/update-amount
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
    const validatedData = updateAmountSchema.parse(body);

    // อัพเดทจำนวนเงิน
    const updatedPayment = await prisma.paymentConfirmation.update({
      where: { id },
      data: {
        amount: validatedData.amount,
        updatedAt: new Date(),
      },
    });

    // รีแวลิดเดท path เพื่อให้ข้อมูลอัพเดท
    revalidatePath('/admin/payment-confirmation');

    return NextResponse.json({
      message: 'อัพเดทจำนวนเงินสำเร็จ',
      payment: updatedPayment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ถูกต้อง', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating amount:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการอัพเดทจำนวนเงิน' },
      { status: 500 }
    );
  }
} 