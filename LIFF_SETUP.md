# LINE LIFF Setup Guide

## ปัญหาที่พบและการแก้ไข

### 1. ตรวจสอบการตั้งค่า LIFF ID
- ตรวจสอบว่า `NEXT_PUBLIC_LIFF_ID` ใน `.env` ถูกต้อง
- LIFF ID ปัจจุบัน: `2006622559-QdOeZ7Ge`

### 2. ปัญหาที่อาจเกิดขึ้น

#### ปัญหา: ระบบไม่ login อัตโนมัติ
**สาเหตุ:**
- LIFF SDK ไม่ได้โหลด
- LIFF ID ไม่ถูกต้อง
- ไม่ได้อยู่ใน LINE environment
- การตรวจสอบ LIFF environment ไม่ถูกต้อง

**การแก้ไข:**
1. ตรวจสอบ LIFF ID ใน LINE Developers Console
2. ตรวจสอบ Endpoint URL ใน LIFF settings
3. ตรวจสอบ Scope permissions

### 3. การทดสอบ LIFF

#### ขั้นตอนการทดสอบ:
1. เปิดแอปใน LINE Browser
2. ตรวจสอบ Console logs
3. ใช้ LiffStatus component เพื่อดูสถานะ

#### Debug Commands:
```javascript
// ตรวจสอบใน Browser Console
console.log('LIFF Available:', typeof window.liff !== 'undefined');
console.log('LIFF Initialized:', window.liff?.isReady());
console.log('LIFF Logged In:', window.liff?.isLoggedIn());
console.log('In LIFF Client:', window.liff?.isInClient());
```

### 4. การใช้งาน Components

#### LiffAutoLogin
```tsx
import LiffAutoLogin from '@/components/LiffAutoLogin';

// ใช้ LIFF ID จาก environment
<LiffAutoLogin>
  <YourApp />
</LiffAutoLogin>

// หรือส่ง LIFF ID เฉพาะ
<LiffAutoLogin liffId="your-liff-id">
  <YourApp />
</LiffAutoLogin>
```

#### LiffStatus (สำหรับ Debug)
```tsx
import LiffStatus from '@/components/LiffStatus';

<LiffStatus />
```

### 5. LINE Developers Console Settings

#### LIFF Settings ที่ต้องตรวจสอบ:
- **LIFF ID**: `2006622559-QdOeZ7Ge`
- **Endpoint URL**: `https://app.treetelu.com`
- **Scope**: `profile`, `openid`
- **Bot link feature**: เปิดใช้งานถ้าต้องการ

#### Channel Settings:
- **Channel ID**: `2006622559`
- **Channel Secret**: ตรวจสอบใน `.env`
- **Webhook URL**: ตั้งค่าถ้าต้องการ

### 6. Troubleshooting

#### ถ้า Login ไม่ทำงาน:
1. ตรวจสอบ Network tab ใน DevTools
2. ดู Console errors
3. ตรวจสอบ CORS settings
4. ตรวจสอบ SSL certificate

#### ถ้า Profile ไม่แสดง:
1. ตรวจสอบ Scope permissions
2. ตรวจสอบ API response
3. ตรวจสอบ Database connection

### 7. การ Deploy

#### สิ่งที่ต้องตรวจสอบก่อน Deploy:
- [ ] LIFF ID ถูกต้อง
- [ ] Endpoint URL ตรงกับ production domain
- [ ] Environment variables ครบถ้วน
- [ ] SSL certificate ใช้งานได้
- [ ] CORS settings ถูกต้อง

### 8. Logs และ Monitoring

#### สิ่งที่ควร Monitor:
- LIFF initialization success rate
- Login success rate
- Profile fetch success rate
- Error rates และ types

#### Log Locations:
- Browser Console
- Server logs (`/api/auth/liff-login`)
- Database logs