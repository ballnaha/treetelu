"use client";

import { useState, useRef, ChangeEvent, FormEvent, ReactNode } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Snackbar,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  IconButton,
  Stack
} from '@mui/material';
// import { Editor } from '@tinymce/tinymce-react'; // ปิดการใช้งาน Editor ชั่วคราว
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

// กำหนดหมวดหมู่บทความที่สามารถเลือกได้
const categories = [
  'ฮวงจุ้ย',
  'ความเชื่อ',
  'การดูแล',
  'ไลฟ์สไตล์',
  'สุขภาพ',
  'อื่นๆ'
];

export default function WriteBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // สร้าง state สำหรับจัดเก็บข้อมูลบทความ
  const [postData, setPostData] = useState({
    title: '',
    excerpt: '',
    category: '',
    image: '/images/blog/placeholder.jpg', // รูปตัวอย่างเริ่มต้น
    slug: '',
    date: new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  });
  
  // สร้าง state สำหรับจัดเก็บเนื้อหาบทความแบบ HTML
  const [content, setContent] = useState('');
  
  // สร้าง ref สำหรับ Editor
  const editorRef = useRef<any>(null);
  
  // สร้าง state สำหรับการตรวจสอบความถูกต้องของข้อมูล
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    excerpt: false,
    category: false,
    content: false
  });
  
  // สร้างฟังก์ชันสำหรับการเปลี่ยนแปลงข้อมูลใน TextField
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'title') {
      // สร้าง slug อัตโนมัติจากชื่อบทความ
      const slug = String(value)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0E00-\u0E7F\w\-]/g, '') // อนุญาตให้ใช้ภาษาไทยและตัวอักษรภาษาอังกฤษ
        .replace(/\-\-+/g, '-');
      
      setPostData(prev => ({ ...prev, [name]: value, slug }));
    } else {
      setPostData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // ฟังก์ชันสำหรับการเปลี่ยนแปลงข้อมูลใน Select
  const handleSelectChange = (e: SelectChangeEvent<string>, child: ReactNode) => {
    const { name, value } = e.target;
    setPostData(prev => ({ ...prev, [name as string]: value }));
  };
  
  // ฟังก์ชันเมื่อมีการเปลี่ยนแปลงเนื้อหาใน Editor
  const handleEditorChange = (content: string) => {
    setContent(content);
  };
  
  // ฟังก์ชันสำหรับเปิด file input
  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // ฟังก์ชันสำหรับการอัปโหลดรูปภาพ
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ตรวจสอบว่าเป็นรูปภาพหรือไม่
    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      return;
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }
    
    try {
      setUploading(true);
      
      // เก็บข้อมูลรูปภาพเดิมเพื่อใช้ในการลบ
      const currentImage = postData.image;
      
      // ตรวจสอบว่ารูปภาพเดิมไม่ใช่ placeholder และเป็นรูปภาพที่อัปโหลดเอง
      if (currentImage && 
          currentImage !== '/images/blog/placeholder.jpg' && 
          currentImage.startsWith('/images/blog/')) {
        try {
          // ดึงชื่อไฟล์จาก URL
          const oldFileName = currentImage.split('/').pop();
          console.log('พบรูปภาพเดิม จะทำการลบก่อนอัปโหลดรูปใหม่:', oldFileName);
          
          // ส่งคำขอลบไฟล์เดิมไปที่ API
          const deleteResponse = await fetch(`/api/upload?filename=${oldFileName}`, {
            method: 'DELETE',
          });
          
          if (!deleteResponse.ok) {
            console.warn('ไม่สามารถลบไฟล์รูปภาพเดิมได้:', await deleteResponse.text());
          } else {
            console.log('ลบไฟล์รูปภาพเดิมเรียบร้อยแล้ว:', oldFileName);
          }
        } catch (deleteError) {
          console.error('เกิดข้อผิดพลาดในการลบรูปภาพเดิม:', deleteError);
          // ทำการอัปโหลดรูปใหม่ต่อไปแม้ว่าจะลบรูปเดิมไม่สำเร็จ
        }
      }
      
      // สร้าง FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      const result = await response.json();
      
      // อัปเดต state
      setPostData(prev => ({ ...prev, image: result.url }));
      setError('');
      
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
      // รีเซ็ต input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // ฟังก์ชันสำหรับลบรูปภาพ
  const handleDeleteImage = () => {
    setPostData(prev => ({ ...prev, image: '/images/blog/placeholder.jpg' }));
  };
  
  // ฟังก์ชันสำหรับตรวจสอบความถูกต้องของข้อมูล
  const validateForm = () => {
    const newErrors = {
      title: postData.title.trim() === '',
      excerpt: postData.excerpt.trim() === '',
      category: postData.category === '',
      content: content.trim() === '' || content === '<p></p>'
    };
    
    setValidationErrors(newErrors);
    
    // ส่งคืนค่าว่าข้อมูลถูกต้องหรือไม่
    return !Object.values(newErrors).some(error => error);
  };
  
  // ฟังก์ชันสำหรับบันทึกบทความ
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!validateForm()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    
    try {
      // สร้างข้อมูลบทความ
      const blogPost = {
        id: Date.now(), // ใช้เวลาปัจจุบันเป็น ID
        title: postData.title,
        excerpt: postData.excerpt,
        image: postData.image,
        slug: postData.slug,
        date: postData.date,
        category: postData.category,
        content: content
      };
      
      // ส่งข้อมูลไปยัง API เพื่อบันทึกบทความ
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogPost),
      });
      
      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการบันทึกบทความ');
      }
      
      // แสดงข้อความสำเร็จ
      setSuccess(true);
      
      // รีเซ็ตฟอร์ม
      setPostData({
        title: '',
        excerpt: '',
        category: '',
        image: '/images/blog/placeholder.jpg',
        slug: '',
        date: new Date().toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });
      
      setContent('');
      
      // รอสักครู่แล้วไปยังหน้ารายการบทความ
      setTimeout(() => {
        router.push('/admin/blog');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error saving blog post:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกบทความ');
    } finally {
      setLoading(false);
    }
  };
  
  // ฟังก์ชันปิดการแจ้งเตือน
  const handleCloseAlert = () => {
    setSuccess(false);
    setError('');
  };
  
  return (
    <Box sx={{ py: 5, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            เขียนบทความใหม่
          </Typography>
          <Divider sx={{ mb: 4 }} />
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* ชื่อบทความ */}
            <TextField
              fullWidth
              label="ชื่อบทความ"
              name="title"
              value={postData.title}
              onChange={handleInputChange}
              margin="normal"
              required
              error={validationErrors.title}
              helperText={validationErrors.title ? 'กรุณากรอกชื่อบทความ' : ''}
            />
            
            {/* Slug */}
            <TextField
              fullWidth
              label="Slug (URL)"
              name="slug"
              value={postData.slug}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
              helperText="Slug จะถูกสร้างอัตโนมัติจากชื่อบทความ"
            />
            
            {/* คำอธิบายสั้นๆ */}
            <TextField
              fullWidth
              label="คำอธิบายสั้นๆ (Excerpt)"
              name="excerpt"
              value={postData.excerpt}
              onChange={handleInputChange}
              margin="normal"
              required
              multiline
              rows={2}
              error={validationErrors.excerpt}
              helperText={validationErrors.excerpt ? 'กรุณากรอกคำอธิบายสั้นๆ' : ''}
            />
            
            {/* หมวดหมู่ */}
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              error={validationErrors.category}
            >
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                name="category"
                value={postData.category}
                label="หมวดหมู่"
                onChange={handleSelectChange}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.category && (
                <FormHelperText>กรุณาเลือกหมวดหมู่</FormHelperText>
              )}
            </FormControl>
            
            {/* วันที่ */}
            <TextField
              fullWidth
              label="วันที่เผยแพร่"
              name="date"
              value={postData.date}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
              helperText="วันที่จะถูกกำหนดเป็นวันปัจจุบันโดยอัตโนมัติ"
            />
            
            {/* รูปภาพ */}
            <Box sx={{ mt: 3, mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                รูปภาพหลัก
              </Typography>
              <Box 
                sx={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: 200,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  overflow: 'hidden',
                  mb: 2
                }}
              >
                <Image
                  src={postData.image}
                  alt="รูปภาพบทความ"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button 
                  variant="contained" 
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleImageButtonClick}
                  disabled={uploading}
                >
                  {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                  {uploading && (
                    <CircularProgress 
                      size={20} 
                      sx={{ ml: 1, color: 'white' }} 
                    />
                  )}
                </Button>
                
                <IconButton 
                  color="error" 
                  onClick={handleDeleteImage}
                  disabled={uploading || postData.image === '/images/blog/placeholder.jpg'}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
              
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                รูปแบบไฟล์ที่รองรับ: JPG, PNG, GIF, WEBP (ขนาดไม่เกิน 5MB)
              </Typography>
              
              <TextField
                fullWidth
                label="URL รูปภาพ"
                name="image"
                value={postData.image}
                onChange={handleInputChange}
                margin="normal"
                helperText="คุณสามารถระบุ URL ของรูปภาพโดยตรงหรืออัปโหลดรูปภาพใหม่ได้"
              />
            </Box>
            
            {/* เนื้อหาบทความ */}
            <Box sx={{ mt: 3, mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                เนื้อหาบทความ
              </Typography>
              {validationErrors.content && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                  กรุณากรอกเนื้อหาบทความ
                </Typography>
              )}
              
              {/* ทดแทน TinyMCE ด้วย Textarea ชั่วคราว */}
              <TextField
                fullWidth
                multiline
                rows={15}
                label="เนื้อหาบทความ (HTML)"
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>ใส่เนื้อหาบทความที่นี่ (รองรับ HTML)</p>"
                sx={{ 
                  fontFamily: 'monospace',
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace'
                  }
                }}
              />
              
              {/* แสดงคำแนะนำการใช้ HTML */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                คำแนะนำ: คุณสามารถใช้แท็ก HTML พื้นฐานได้ เช่น &lt;p&gt;, &lt;h1&gt;-&lt;h6&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </Typography>
              
              {/* 
              <Editor
                apiKey="your-tinymce-api-key" // ควรใช้ API key จาก TinyMCE
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue=""
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family: Sarabun, Arial, sans-serif; font-size: 16px }'
                }}
                onEditorChange={handleEditorChange}
              />
              */}
            </Box>
            
            {/* ปุ่มบันทึก */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => router.push('/admin/blog')}
                sx={{
                  minWidth: 110,
                  mr: 2,
                  borderRadius: '8px',
                }}
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกบทความ'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
      
      {/* แจ้งเตือน */}
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          บันทึกบทความเรียบร้อยแล้ว
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 