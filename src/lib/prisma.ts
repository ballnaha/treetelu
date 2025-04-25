// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// ป้องกันการสร้าง PrismaClient หลายตัวในช่วง development
// กำหนด global type
declare global {
  var prisma: PrismaClient | undefined
}

// กำหนดตัวแปร prisma client
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = global.prisma
}

export default prisma
