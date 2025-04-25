// prisma.js - CommonJS version
const { PrismaClient } = require('@prisma/client')

/**
 * @type {PrismaClient | undefined}
 */
let prisma

// check if we are in production mode
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // check if there is already a connection to the database
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = global.prisma
}

module.exports = prisma 