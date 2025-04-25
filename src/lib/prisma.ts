// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'

// ป้องกันการสร้าง PrismaClient หลายตัวในช่วง development
declare global {
  var prisma: PrismaClient | undefined
}

// กำหนด options สำหรับ PrismaClient
const prismaOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'production' 
    ? ['error' as const] 
    : ['query' as const, 'error' as const, 'warn' as const],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}

// สร้าง PrismaClient ด้วย try/catch สำหรับจัดการข้อผิดพลาดในการ initialize
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  try {
    prisma = new PrismaClient(prismaOptions)
  } catch (e) {
    console.error('Failed to create PrismaClient in production', e)
    throw e
  }
} else {
  // ในโหมด development ให้ใช้ global variable
  if (!global.prisma) {
    try {
      global.prisma = new PrismaClient(prismaOptions)
    } catch (e) {
      console.error('Failed to create PrismaClient in development', e)
      throw e
    }
  }
  prisma = global.prisma
}

export default prisma
