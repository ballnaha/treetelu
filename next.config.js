// @ts-check

/**
 * นำเข้าการตั้งค่าจาก next.config.ts
 * ไฟล์นี้จำเป็นเพราะ Next.js จะมองหา next.config.js เป็นหลัก
 */

// ใช้ require เพื่อโหลดไฟล์ ts-node/register ที่จะแปลง typescript เป็น javascript
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
  },
});

// นำเข้าไฟล์ next.config.ts
const config = require('./next.config.ts');

// Export default config
module.exports = config.default; 