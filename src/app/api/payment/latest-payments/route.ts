import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get('source');
    const ref = url.searchParams.get('ref');
    
    if (!source || !ref) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลที่จำเป็นสำหรับการค้นหา (source, ref)' },
        { status: 400 }
      );
    }
    
    console.log(`API latest-payments: Searching latest payments with source=${source}, ref=${ref}`);
    
    // สร้าง Omise instance
    const omise = require('omise')({
      publicKey: process.env.OMISE_PUBLIC_KEY,
      secretKey: process.env.OMISE_SECRET_KEY,
    });
    
    // เรียก API ของ Omise เพื่อดึงรายการชำระเงินล่าสุด
    try {
      // เพิ่ม timestamp เพื่อหลีกเลี่ยงปัญหา caching
      const timestamp = new Date().getTime();
      
      // ดึงรายการชำระเงินล่าสุด 10 รายการ
      const charges = await omise.charges.list({ 
        limit: 10, 
        order: 'reverse_chronological',
        _timestamp: timestamp 
      });
      
      if (!charges || !charges.data || charges.data.length === 0) {
        console.log('API latest-payments: No charges found');
        return NextResponse.json({
          success: false,
          message: 'ไม่พบข้อมูลการชำระเงินล่าสุด'
        }, { status: 404 });
      }
      
      console.log(`API latest-payments: Found ${charges.data.length} recent charges`);
      
      // กรองเฉพาะรายการที่เกี่ยวข้องกับ source และ ref
      // ตรวจสอบจากข้อมูลเวลาการสร้าง charge เทียบกับเวลาที่อยู่ใน ref
      const refTimestamp = parseInt(ref);
      const now = Date.now();
      const timeThreshold = 15 * 60 * 1000; // 15 นาที
      
      // กรองรายการที่สร้างไม่เกิน 15 นาทีนับจากเวลาใน ref
      const relevantPayments = charges.data
        .filter((charge: any) => {
          // ตรวจสอบเวลา
          const chargeCreatedAt = new Date(charge.created_at).getTime();
          const timeDiff = Math.abs(chargeCreatedAt - refTimestamp);
          
          // ถ้าเป็นบัตรเครดิต/เดบิต
          if (source === 'cc') {
            return (
              timeDiff < timeThreshold && 
              (!charge.source || charge.source.type === 'card')
            );
          }
          
          // ถ้าเป็น PromptPay
          if (source === 'pp') {
            return (
              timeDiff < timeThreshold && 
              charge.source && 
              charge.source.type === 'promptpay'
            );
          }
          
          return false;
        })
        .map((charge: any) => ({
          charge_id: charge.id,
          amount: charge.amount / 100,
          status: charge.status,
          created_at: charge.created_at,
          source_type: charge.source ? charge.source.type : 'unknown'
        }));
      
      if (relevantPayments.length === 0) {
        console.log('API latest-payments: No relevant payments found');
        return NextResponse.json({
          success: false,
          message: 'ไม่พบข้อมูลการชำระเงินที่เกี่ยวข้อง'
        }, { status: 404 });
      }
      
      console.log(`API latest-payments: Found ${relevantPayments.length} relevant payments`);
      
      return NextResponse.json({
        success: true,
        payments: relevantPayments
      });
      
    } catch (omiseError: any) {
      console.error('API latest-payments: Error retrieving charges from Omise:', omiseError);
      return NextResponse.json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูลการชำระเงิน',
        error: omiseError.message || 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in latest-payments API:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูลการชำระเงิน', error: String(error) },
      { status: 500 }
    );
  }
} 