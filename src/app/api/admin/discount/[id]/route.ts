import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// GET - ดึงข้อมูล discount code ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Token การยืนยันตัวตน" },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key";
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      );
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!discountCode) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรหัสส่วนลด" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discountCode,
    });
  } catch (error) {
    console.error("Error fetching discount code:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// PUT - อัปเดต discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Token การยืนยันตัวตน" },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key";
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      minAmount,
      maxDiscount,
      description,
      maxUses,
      startDate,
      endDate,
      status,
    } = body;

    // ตรวจสอบว่ารหัสซ้ำหรือไม่ (ยกเว้นตัวเอง)
    if (code) {
      const existingCode = await prisma.discountCode.findFirst({
        where: {
          code: code.toUpperCase(),
          id: { not: parseInt(params.id) },
        },
      });

      if (existingCode) {
        return NextResponse.json(
          { success: false, error: "รหัสส่วนลดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }
    }

    const discountCode = await prisma.discountCode.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(type && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(minAmount !== undefined && { minAmount: parseFloat(minAmount) }),
        ...(maxDiscount !== undefined && {
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        }),
        ...(description && { description }),
        ...(maxUses !== undefined && { maxUses: parseInt(maxUses) }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตรหัสส่วนลดเรียบร้อยแล้ว",
      data: discountCode,
    });
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตรหัสส่วนลด" },
      { status: 500 }
    );
  }
}

// DELETE - ลบ discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบ Authentication
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Token การยืนยันตัวตน" },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT Token
    const jwtSecret = process.env.JWT_SECRET || "your-fallback-secret-key";
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ Admin
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      );
    }

    await prisma.discountCode.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: "ลบรหัสส่วนลดเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการลบรหัสส่วนลด" },
      { status: 500 }
    );
  }
}
