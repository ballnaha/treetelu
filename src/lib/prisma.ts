// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// ป้องกันการสร้าง PrismaClient หลายตัวในช่วง development
// กำหนด global type
declare global {
  var prisma: PrismaClient | undefined
}

// กำหนดตัวแปร prisma client
let prisma: PrismaClient;

// แทนที่จะใช้เงื่อนไข production/development แบบเดิม
// ให้ใช้ global instance เสมอเพื่อป้องกันปัญหาในช่วง hot-reload
if (global.prisma) {
  prisma = global.prisma;
} else {
  global.prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  prisma = global.prisma;
}

export default prisma
