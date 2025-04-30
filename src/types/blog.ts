/**
 * BlogPost Interface
 * ใช้สำหรับกำหนดโครงสร้างข้อมูลบทความ
 */
export interface BlogPost {
  id: number; // ID ของบทความ
  title: string; // ชื่อบทความ
  excerpt: string; // คำอธิบายสั้นๆ
  content: string; // เนื้อหาบทความในรูปแบบ HTML
  image: string; // URL ของรูปภาพ
  slug: string; // URL slug สำหรับลิงก์ไปยังบทความ
  date: string; // วันที่เผยแพร่บทความ
  category: string; // หมวดหมู่บทความ
  published?: boolean; // สถานะการเผยแพร่
  userId?: number | null; // ID ของผู้เขียน (ถ้ามี หรือเป็น null)
  createdAt?: Date; // วันที่สร้าง
  updatedAt?: Date; // วันที่อัปเดตล่าสุด
} 