// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// ป้องกันการสร้าง PrismaClient หลายตัวในช่วง development
declare global {
  var prisma: PrismaClient | undefined
}

// สร้าง PrismaClient ด้วย try/catch สำหรับจัดการข้อผิดพลาดในการ initialize
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  try {
    prisma = new PrismaClient()
  } catch (e) {
    console.error('Failed to create PrismaClient in production', e)
    throw e
  }
} else {
  // ในโหมด development ให้ใช้ global variable
  if (!global.prisma) {
    try {
      global.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      })
    } catch (e) {
      console.error('Failed to create PrismaClient in development', e)
      throw e
    }
  }
  prisma = global.prisma
}

export default prisma
