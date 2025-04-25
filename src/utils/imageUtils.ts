import { Product } from '../types/product';

/**
 * สร้าง slug จากข้อความ
 * @param text ข้อความที่ต้องการแปลงเป็น slug
 * @returns slug ที่สร้างขึ้น
 */
export const generateSlug = (text: string): string => {
  // แปลงอักขระไทยเป็นอักขระละติน (transliteration)
  const transliterated = text
    .replace(/[\u0E00-\u0E7F]/g, char => {
      // แมปอักขระไทยเป็นอักษรละติน (อย่างง่าย)
      const thaiMap: Record<string, string> = {
        'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ฆ': 'kh', 'ง': 'ng',
        'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
        'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th',
        'ฒ': 'th', 'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th',
        'ท': 'th', 'ธ': 'th', 'น': 'n', 'บ': 'b', 'ป': 'p',
        'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph',
        'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
        'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
        'อ': 'o', 'ฮ': 'h',
        // สระ
        'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am', 'ิ': 'i',
        'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
        'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai',
        '็': '', '่': '', '้': '', '๊': '', '๋': '', '์': ''
      };
      return thaiMap[char] || '';
    });

  // แปลงเป็น slug
  return transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
    .trim()
    .replace(/[\s]+/g, '-') // แทนที่ช่องว่างด้วย -
    .replace(/^-+|-+$/g, '') // ลบ - ที่อยู่ต้นและท้าย
    || 'product'; // กรณีที่ slug ว่าง ให้ใช้ 'product'
};

/**
 * ฟังก์ชันสำหรับแปลง path รูปภาพผลิตภัณฑ์ให้ถูกต้อง
 * @param product ข้อมูลผลิตภัณฑ์
 * @returns path รูปภาพที่ถูกต้อง
 */
export const getProductImagePath = (product: Product): string => {
  let imagePath = "/images/no-image.png";
  const timestamp = Date.now(); // สร้าง timestamp ในระดับมิลลิวินาที
  
  // ถ้ามี productImg ให้ใช้ path ที่ถูกต้อง
  if (product.productImg && product.productImg !== 'undefined') {
    // ตรวจสอบว่า productImg มี path เต็มหรือไม่
    if (typeof product.productImg === 'string' && (product.productImg.startsWith('/') || product.productImg.startsWith('http'))) {
      imagePath = product.productImg;
    } else if (typeof product.productImg === 'string') {
      // เพิ่ม prefix สำหรับรูปภาพที่อยู่ในโฟลเดอร์ thumbnails
      imagePath = `/images/product/${product.productImg}`;
    }
  } else if (product.image && product.image !== 'undefined') {
    // ถ้าไม่มี productImg แต่มี image
    if (typeof product.image === 'string' && (product.image.startsWith('/') || product.image.startsWith('http'))) {
      imagePath = product.image;
    } else if (typeof product.image === 'string') {
      imagePath = `/images/product/${product.image}`;
    }
  }
  
  // ป้องกันกรณีที่รูปไม่มีอยู่จริง
  if (imagePath.includes('undefined')) {
    imagePath = "/images/no-image.png";
  }
  
  // เพิ่ม timestamp เพื่อป้องกันการแคช
  if (!imagePath.includes('no-image.png') && !imagePath.startsWith('http')) {
    // ตรวจสอบว่า URL มี query parameter อยู่แล้วหรือไม่
    if (imagePath.includes('?')) {
      imagePath = `${imagePath}&v=${timestamp}`;
    } else {
      imagePath = `${imagePath}?v=${timestamp}`;
    }
  }
  
  // สำหรับ URL ภายนอก ไม่ต้องเพิ่ม timestamp
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // console.log(`[getProductImagePath] Generated image path: ${imagePath}`);
  return imagePath;
};

/**
 * ฟังก์ชันสำหรับแปลงข้อมูลผลิตภัณฑ์จาก API ให้อยู่ในรูปแบบที่ใช้งานได้
 * @param product ข้อมูลผลิตภัณฑ์จาก API
 * @returns ข้อมูลผลิตภัณฑ์ที่แปลงแล้ว
 */
export const formatProductData = (product: any): Product => {
  // คำนวณราคา
  const price = typeof product.price === 'string' ? parseFloat(product.price) : 
                (product.salesPrice ? parseFloat(product.salesPrice) : 650);
  
  // แปลง path รูปภาพ
  const imagePath = getProductImagePath(product);
  
  // กำหนดชื่อสินค้า
  const productName = product.productName || product.name || "สินค้า";
  
  // สร้าง slug จากชื่อสินค้า หรือใช้ slug ที่มีอยู่แล้ว
  const slug = product.slug || generateSlug(productName);
  
  return {
    ...product,
    price,
    image: imagePath,
    name: productName,
    description: product.productDesc || product.description || "รายละเอียดสินค้า",
    rating: product.rating || 4.5,
    id: product.id || product.sku || String(Math.random()).slice(2, 10),
    slug
  };
};
