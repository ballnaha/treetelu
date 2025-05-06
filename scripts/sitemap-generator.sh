#!/bin/bash

# สคริปต์สำหรับสร้าง sitemap.xml แบบอัตโนมัติ
# สามารถเรียกใช้จาก cron job เช่น
# 0 1 * * * /path/to/sitemap-generator.sh > /path/to/logs/sitemap-generator.log 2>&1

# กำหนดพาธของโปรเจค
PROJECT_PATH="/www/wwwroot/treetelu.com"

# เปลี่ยนไปยังไดเร็กทอรีของโปรเจค
cd $PROJECT_PATH

# แสดงวันที่และเวลาที่รัน
echo "============================================"
echo "เริ่มการสร้าง sitemap เมื่อ: $(date)"
echo "============================================"

# รัน script generate-sitemap
npm run generate-sitemap

# ตรวจสอบว่ารันสำเร็จหรือไม่
if [ $? -eq 0 ]; then
  echo "สร้าง sitemap.xml สำเร็จ"
  echo "ไฟล์ถูกบันทึกที่: $PROJECT_PATH/public/sitemap.xml"
else
  echo "เกิดข้อผิดพลาดในการสร้าง sitemap.xml"
  exit 1
fi

echo "============================================"
echo "เสร็จสิ้นการสร้าง sitemap เมื่อ: $(date)"
echo "============================================"

exit 0 