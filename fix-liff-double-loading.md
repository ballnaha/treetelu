# แก้ไขปัญหา LINE LIFF โหลด 2 ครั้งใน Production

## ปัญหาที่พบ
เมื่อเปิดแอปใน LINE LIFF บน production จะมีการโหลด 2 ครั้ง ทำให้ผู้ใช้เห็นหน้าจอกระพริบหรือโหลดช้า

## สาเหตุของปัญหา
1. **Double Provider Wrapping**: มี CartProvider ห่อหุ้มซ้ำซ้อนใน layout.tsx และ ClientProvider
2. **Multiple useEffect**: LiffAutoLogin มี useEffect หลายตัวที่ทำงานซ้ำซ้อน
3. **LIFF SDK Loading ซ้ำ**: การโหลด LIFF SDK เกิดขึ้นหลายครั้ง
4. **AuthContext Re-render**: การ re-render ที่ไม่จำเป็นใน AuthContext

## การแก้ไข

### 1. แก้ไข Layout Structure
- ลบ CartProvider ที่ซ้ำซ้อนใน layout.tsx
- ให้ ClientProvider จัดการ providers ทั้งหมด

### 2. ปรับปรุง LiffAutoLogin
- เพิ่ม hasInitialized state เพื่อป้องกันการทำงานซ้ำ
- ลบ dependencies ใน useEffect เพื่อให้ทำงานแค่ครั้งเดียว
- เพิ่มการตรวจสอบ window.liff._initialized

### 3. ปรับปรุง LIFF Utils
- เพิ่มการตรวจสอบว่า LIFF ถูก initialize แล้วหรือยัง
- ป้องกันการ initialize ซ้ำ

### 4. ปรับปรุง LIFF SDK Loading
- ตรวจสอบว่ามี script tag อยู่แล้วหรือไม่
- รอให้ script โหลดเสร็จแทนการสร้างใหม่

### 5. ปรับปรุง AuthContext
- ลดการ re-render ที่ไม่จำเป็น
- ปรับปรุง useEffect ให้ทำงานแค่ครั้งเดียว

## ผลลัพธ์ที่คาดหวัง
- ลดการโหลดซ้ำใน LINE LIFF
- ปรับปรุงประสิทธิภาพการโหลดหน้า
- ลดการกระพริบของหน้าจอ
- ประสบการณ์ผู้ใช้ที่ดีขึ้น

## การทดสอบ
1. เปิดแอปใน LINE LIFF บน production
2. ตรวจสอบ console log ว่ามีการ initialize แค่ครั้งเดียว
3. ตรวจสอบว่าไม่มีการโหลดหน้าซ้ำ
4. ทดสอบการ login อัตโนมัติ

## หมายเหตุ
- การเปลี่ยนแปลงนี้จะช่วยปรับปรุงประสิทธิภาพโดยรวมของแอป
- ควรทดสอบทั้งใน development และ production environment
- ตรวจสอบให้แน่ใจว่าการ login ยังทำงานปกติ