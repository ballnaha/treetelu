'use client';

import { useState, useEffect } from 'react';
import { Product } from '../client';
import { CircularProgress } from '@mui/material';
import { addNoCacheParam } from '@/utils/imageUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  Stack,
  Paper,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import UploadIcon from '@mui/icons-material/Upload';
import ImageIcon from '@mui/icons-material/Image';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface ProductImage {
  id?: number;
  productId?: number;
  imageName: string;
  imageDesc?: string;
  isNew?: boolean;
  file?: File;
  preview?: string;
}

interface ProductDialogProps {
  open: boolean;
  product: Product | null;
  isNewProduct: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<Product | null>;
  onDelete: (productId: string) => void;
}

export default function ProductDialog({
  open,
  product,
  isNewProduct,
  onClose,
  onSave,
  onDelete
}: ProductDialogProps) {
  // Common TextField styles for full width
  const fullWidthFieldStyle = {
    width: '100%',
    '& .MuiInputBase-root': {
      width: '100%'
    },
    '& .MuiSelect-select': {
      width: '100%'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      width: '100%'
    }
  };
  
  // Responsive styles
  const responsiveStyles = {
    dialogPaper: {
      width: '100%',
      maxWidth: { xs: '100%', sm: '90%', md: '80%', lg: '1200px' },
      margin: 0,
      borderRadius: { xs: 0, sm: 1 },
      height: { xs: '100%', sm: 'auto' },
      maxHeight: { xs: '100%', sm: '90vh' }
    },
    dialogContent: {
      p: { xs: 2, sm: 3 },
      overflowX: 'hidden'
    },
    sectionTitle: {
      fontSize: { xs: '0.9rem', sm: '1rem' },
      fontWeight: 600,
      mb: 1.5,
      mt: { xs: 2, sm: 0 }
    },
    sectionSubtitle: {
      fontSize: { xs: '0.85rem', sm: '0.9rem' },
      fontWeight: 500,
      color: 'text.secondary',
      alignSelf: 'flex-start'
    },
    paper: {
      p: { xs: 1.5, sm: 2 },
      mb: 2,
      width: '100%',
      boxSizing: 'border-box'
    },
    imageContainer: {
      height: { xs: 150, sm: 200 },
      width: '100%',
      mb: 1.5
    },
    thumbnailContainer: {
      aspectRatio: '1/1',
      width: '100%'
    },
    button: {
      width: '100%',
      py: { xs: 0.75, sm: 1 }
    }
  };
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categories, setCategories] = useState<{id: number, categoryName: string}[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ProductImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [deletingImageIndex, setDeletingImageIndex] = useState<number>(-1);
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Generate SKU based on pattern TTL + YY + MM + running number
  const generateSku = async () => {
    try {
      // Get current date for YY and MM parts
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
      
      // Fetch the latest product to determine running number
      const response = await fetch('/api/admin/products/latest-sku', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest SKU');
      }
      
      const data = await response.json();
      let runningNumber = 1; // Default to 1 if no products exist
      
      if (data.latestSku) {
        // Extract the running number from any existing SKU
        // Look for the numeric part at the end of the SKU
        const match = data.latestSku.match(/TTL\d{4}(\d+)$/);
        
        if (match && match[1]) {
          // Get the numeric part and increment it
          const currentRunningNumber = parseInt(match[1], 10);
          if (!isNaN(currentRunningNumber)) {
            runningNumber = currentRunningNumber + 1;
          }
        } else {
          // If pattern doesn't match, try to extract the last 4 digits as running number
          const lastFourDigits = data.latestSku.slice(-4);
          const parsedNumber = parseInt(lastFourDigits, 10);
          if (!isNaN(parsedNumber)) {
            runningNumber = parsedNumber + 1;
          }
        }
      }
      
      // Format running number with leading zeros to ensure 4 digits
      const formattedRunningNumber = runningNumber.toString().padStart(4, '0');
      
      // Combine all parts to create the SKU
      return `TTL${year}${month}${formattedRunningNumber}`;
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Fallback pattern with timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-4);
      return `TTL${timestamp}`;
    }
  };

  // Reset form when product changes
  useEffect(() => {
    if (isNewProduct) {
      // Generate SKU for new products
      generateSku().then(newSku => {
        setFormData({
          productName: '',
          sku: newSku,
          slug: '',
          productDesc: '',
          salesPrice: 0,
          originalPrice: 0,
          stock: 0,
          stockStatus: 'in_stock',
          category: '',
          productStatus: 'on',
          potSize: '',
          plantHeight: '',
          preparationTime: ''
        });
      });
      setImagePreview(null);
      setImageFile(null);
      setAdditionalImages([]);
      setSelectedImageIndex(-1);
    } else if (product) {
      setFormData({
        ...product,
        // Convert null values to empty strings or defaults for form fields
        productName: product.productName || '',
        sku: product.sku || '',
        productDesc: product.productDesc || '',
        salesPrice: product.salesPrice || 0,
        originalPrice: product.originalPrice || 0,
        discount: product.discount || 0,
        stock: product.stock || 0,
        stockStatus: product.stockStatus || 'in_stock',
        category: product.category || '',
        categoryId: product.categoryId || undefined,
        productStatus: product.productStatus || 'on',
        potSize: product.potSize || '',
        plantHeight: product.plantHeight || '',
        preparationTime: product.preparationTime || ''
      });
      
      // Set image preview if product has an image
      if (product.productImg) {
        setImagePreview(`/images/product/${product.productImg}`);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
      
      // Fetch additional images if product exists
      if (product.id) {
        fetchProductImages(product.id);
      } else {
        setAdditionalImages([]);
      }
      setSelectedImageIndex(-1);
    }
  }, [product, isNewProduct, open]);
  
  // Generate slug from product name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
      .replace(/\-\-+/g, '-')       // Replace multiple - with single -
      .replace(/^-+/, '')           // Trim - from start of text
      .replace(/-+$/, '');          // Trim - from end of text
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Update the form data with the new value
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If product name is changed and it's a new product, auto-generate the slug
    if (name === 'productName' && (isNewProduct || !formData.slug)) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = parseInt(e.target.value);
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    setFormData(prev => ({
      ...prev,
      categoryId,
      category: selectedCategory?.categoryName || ''
    }));
  };
  
  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      productStatus: e.target.checked ? 'on' : 'off'
    }));
  };
  
  // Fetch product images
  const fetchProductImages = async (productId: string | number) => {
    try {
      const timestamp = Date.now(); // เพิ่ม timestamp เพื่อป้องกันการแคช
      const response = await fetch(`/api/admin/products/images?productId=${productId}&t=${timestamp}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const images = data.images.map((img: any) => ({
          ...img,
          preview: addNoCacheParam(`/images/product/${img.imageName}`)
        }));
        setAdditionalImages(images);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  };

  // Handle main image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Store the file for later upload
    setImageFile(file);
  };
  
  // Handle additional image upload
  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: ProductImage[] = [];
    
    Array.from(files).forEach(file => {
      // Create a preview for each file
      const reader = new FileReader();
      reader.onload = () => {
        const newImage: ProductImage = {
          imageName: file.name,
          isNew: true,
          file: file,
          preview: reader.result as string
        };
        
        setAdditionalImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Remove an additional image
  const handleRemoveAdditionalImage = async (index: number) => {
    // ป้องกันการลบซ้ำขณะกำลังลบอยู่
    if (deletingImageIndex !== -1) return;
    
    // ตั้งค่า index ที่กำลังลบ
    setDeletingImageIndex(index);
    
    try {
      // ดึงข้อมูลรูปภาพที่ต้องการลบ
      const imageToRemove = additionalImages[index];
      
      // ถ้ารูปอยู่ในฐานข้อมูล (มี id) ให้ลบผ่าน API
      if (!imageToRemove.isNew && imageToRemove.id) {
        try {
          const response = await fetch(`/api/admin/products/images?id=${imageToRemove.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (!response.ok) {
            console.error('Failed to delete image from server', await response.json());
            setDeletingImageIndex(-1);
            return;
          }
          
          console.log('Image deleted successfully from server');
        } catch (error) {
          console.error('Error deleting image:', error);
          setDeletingImageIndex(-1);
          return;
        }
      }
      
      // ลบรูปภาพออกจาก state
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
      
      // รีเซ็ตรูปที่เลือกถ้าจำเป็น
      if (selectedImageIndex === index) {
        setSelectedImageIndex(-1);
      } else if (selectedImageIndex > index) {
        setSelectedImageIndex(prev => prev - 1);
      }
    } finally {
      // รีเซ็ตสถานะการลบไม่ว่าจะสำเร็จหรือไม่
      setDeletingImageIndex(-1);
    }
  };
  
  // Select an image to view larger
  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index === selectedImageIndex ? -1 : index);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Create a copy of the form data
    const productData = { ...formData };
    
    // If we have a new image file, upload it first
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      try {
        console.log('Uploading main product image...');
        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          productData.productImg = uploadData.filename;
          console.log('Main product image uploaded successfully:', uploadData.filename);
        } else {
          const errorData = await uploadResponse.json();
          console.error('Error uploading image:', errorData);
          alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + (errorData.message || 'Unknown error'));
          return;
        }
      } catch (error) {
        console.error('Exception during image upload:', error);
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        return;
      }
    }
    
    // Save the product first to get the product ID if it's new
    console.log('Saving product data...');
    const savedProduct = await onSave(productData);
    console.log('Product saved successfully:', savedProduct);
    
    // If we have additional images and a product ID, upload them
    if (additionalImages.length > 0 && savedProduct?.id) {
      const productId = savedProduct.id;
      console.log(`Processing ${additionalImages.length} additional images for product ${productId}`);
      
      // Upload new images
      const newImages = additionalImages.filter(img => img.isNew && img.file);
      console.log(`Found ${newImages.length} new images to upload`);
      
      for (const image of newImages) {
        if (image.file) {
          const formData = new FormData();
          formData.append('image', image.file);
          
          try {
            console.log(`Uploading additional image: ${image.imageName}...`);
            const uploadResponse = await fetch('/api/admin/upload', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });
            
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              console.log('Additional image uploaded successfully:', uploadData.filename);
              
              // Save the image reference to the product
              console.log('Saving image reference to database...');
              const saveResponse = await fetch('/api/admin/products/images', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  productId,
                  imageName: uploadData.filename,
                  imageDesc: image.imageDesc || ''
                }),
                credentials: 'include'
              });
              
              if (saveResponse.ok) {
                console.log('Image reference saved successfully');
              } else {
                const errorData = await saveResponse.json();
                console.error('Error saving image reference:', errorData);
              }
            } else {
              const errorData = await uploadResponse.json();
              console.error('Error uploading additional image:', errorData);
            }
          } catch (error) {
            console.error('Exception during additional image upload:', error);
          }
        }
      }
      
      // Add a delay to allow server processing to complete
      console.log('Waiting for server processing...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload product images to get the latest data
      console.log('Reloading product images...');
      if (savedProduct?.id) {
        await fetchProductImages(savedProduct.id);
      }
    }
    
    console.log('Product submission completed');
  };
  
  // Handle delete
  const handleDelete = () => {
    if (product && product.id) {
      onDelete(product.id);
      setDeleteConfirmOpen(false);
    }
  };
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={false}
        scroll="paper"
        sx={{
          '& .MuiDialog-paper': responsiveStyles.dialogPaper,
          '& .MuiDialogContent-root': {
            overflowX: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: { xs: 2, sm: 3 },
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.35rem' },
            fontWeight: 600,
            color: theme => theme.palette.mode === 'dark' ? 'text.primary' : 'common.white'
          }}>
            {isNewProduct ? 'เพิ่มสินค้าใหม่' : 'แก้ไขข้อมูลสินค้า'}
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ 
              color: theme => theme.palette.mode === 'dark' ? 'text.primary' : 'common.white',
              bgcolor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: theme => theme.palette.mode === 'dark' ? 'action.selected' : 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <DialogContent dividers sx={{ ...responsiveStyles.dialogContent, width: '100%', padding: { xs: '16px', sm: '24px' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: '100%' }}>
            {/* Basic Info */}
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <Typography variant="subtitle1" sx={responsiveStyles.sectionTitle}>
                ข้อมูลพื้นฐาน
              </Typography>
              
              <Paper elevation={0} variant="outlined" sx={{ ...responsiveStyles.paper, width: '100%' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%', maxWidth: '100%' }}>
                  <Box sx={{ width: { xs: '100%', sm: 'calc(66.67% - 12px)' } }}>
                    <TextField
                      required
                      label="ชื่อสินค้า"
                      name="productName"
                      value={formData.productName || ''}
                      onChange={handleInputChange}
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 12px)' } }}>
                    <TextField
                      label="รหัสสินค้า (SKU)"
                      name="sku"
                      value={formData.sku || ''}
                      onChange={handleInputChange}
                      helperText="รหัสสินค้าในรูปแบบ TTL + ปี 2 หลัก + เดือน 2 หลัก + running number 4 หลัก"
                      sx={fullWidthFieldStyle}
                      disabled={isNewProduct} // Disable for new products as it's auto-generated
                    />
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 12px)' } }}>
                    <TextField
                      select
                      label="หมวดหมู่"
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleCategoryChange}
                      sx={{
                        ...fullWidthFieldStyle,
                        '& .MuiSelect-select': {
                          width: '100%'
                        }
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="">ไม่ระบุหมวดหมู่</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.categoryName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: 'calc(33.33% - 12px)' } }}>
                    <TextField
                      label="URL Slug"
                      name="slug"
                      value={formData.slug || ''}
                      onChange={handleInputChange}
                      helperText="URL ที่ใช้เข้าถึงหน้าสินค้า (จะถูกสร้างอัตโนมัติจากชื่อสินค้า)"
                      sx={fullWidthFieldStyle}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">/products/</InputAdornment>,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', sm: 'calc(66.67% - 12px)' } }}>
                    <TextField
                      multiline
                      rows={4}
                      label="รายละเอียดสินค้า"
                      name="productDesc"
                      value={formData.productDesc || ''}
                      onChange={handleInputChange}
                      sx={{
                        ...fullWidthFieldStyle,
                        '& .MuiInputBase-root': {
                          width: '100%',
                          '& textarea': {
                            width: '100%'
                          }
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
              
              <Typography variant="subtitle1" sx={responsiveStyles.sectionTitle}>
                ราคาและสต็อก
              </Typography>
              
              <Paper elevation={0} variant="outlined" sx={responsiveStyles.paper}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', maxWidth: '100%' }}>
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      type="number"
                      label="ราคาขาย"
                      name="salesPrice"
                      value={formData.salesPrice || 0}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                      }}
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      type="number"
                      label="ราคาปกติ"
                      name="originalPrice"
                      value={formData.originalPrice || 0}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                      }}
                      helperText="ราคาก่อนลดราคา (ถ้ามี)"
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      type="number"
                      label="จำนวนในสต็อก"
                      name="stock"
                      value={formData.stock || 0}
                      onChange={handleInputChange}
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      select
                      label="สถานะสต็อก"
                      name="stockStatus"
                      value={formData.stockStatus || 'in_stock'}
                      onChange={handleInputChange}
                      sx={{
                        ...fullWidthFieldStyle,
                        '& .MuiSelect-select': {
                          width: '100%'
                        }
                      }}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="in_stock">มีสินค้า</MenuItem>
                      <MenuItem value="out_of_stock">สินค้าหมด</MenuItem>
                      <MenuItem value="on_backorder">สั่งจองล่วงหน้า</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              </Paper>
              
              <Typography variant="subtitle1" sx={responsiveStyles.sectionTitle}>
                คุณสมบัติเพิ่มเติม
              </Typography>
              
              <Paper elevation={0} variant="outlined" sx={{ p: 2, width: '100%' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', maxWidth: '100%' }}>
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      label="ขนาดกระถาง"
                      name="potSize"
                      value={formData.potSize || ''}
                      onChange={handleInputChange}
                      placeholder="เช่น 4 นิ้ว, 6 นิ้ว"
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      label="ความสูงของต้นไม้"
                      name="plantHeight"
                      value={formData.plantHeight || ''}
                      onChange={handleInputChange}
                      placeholder="เช่น 15-20 ซม."
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                  
                  <Box sx={{ width: '42%' }}>
                    <TextField
                      label="เวลาเตรียมสินค้า"
                      name="preparationTime"
                      value={formData.preparationTime || ''}
                      onChange={handleInputChange}
                      placeholder="เช่น 1-2 วัน"
                      sx={fullWidthFieldStyle}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>
            
            {/* Image and Status */}
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <Typography variant="subtitle1" sx={responsiveStyles.sectionTitle}>
                รูปภาพสินค้า
              </Typography>
              
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <Typography variant="subtitle2" gutterBottom sx={responsiveStyles.sectionSubtitle}>
                  รูปภาพหน้าปก
                </Typography>
                
                <Box 
                  sx={{ 
                    ...responsiveStyles.imageContainer,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={addNoCacheParam(imagePreview)}
                      alt="Product preview"
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/no-image.png';
                      }}
                    />
                  ) : (
                    <Stack spacing={1} alignItems="center">
                      <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        ไม่มีรูปภาพ
                      </Typography>
                    </Stack>
                  )}
                </Box>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={responsiveStyles.button}
                  size="small"
                >
                  อัปโหลดรูปภาพหน้าปก
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  แนะนำขนาด 800x800 พิกเซล
                </Typography>
              </Paper>
              
              {/* Additional Images */}
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '100%'
                }}
              >
                <Typography variant="subtitle2" gutterBottom sx={responsiveStyles.sectionSubtitle}>
                  รูปภาพเพิ่มเติม ({additionalImages.length})
                </Typography>
                
                {/* Image Grid */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', mt: 1 }}>
                  {additionalImages.map((image, index) => (
                    <Box sx={{ width: { xs: 'calc(33.33% - 8px)', sm: 'calc(32% - 8px)' } }} key={`img-${index}`}>
                      <Box
                        sx={{
                          position: 'relative',
                          aspectRatio: '1/1',
                          width: '100%',
                          border: '1px solid',
                          borderColor: selectedImageIndex === index ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'primary.main',
                            '& .image-actions': {
                              opacity: 1
                            }
                          }
                        }}
                        onClick={() => handleSelectImage(index)}
                      >
                        <Box
                          component="img"
                          src={image.preview ? addNoCacheParam(image.preview) : '/images/no-image.png'}
                          alt={`Product image ${index + 1}`}
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            aspectRatio: '1/1'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/no-image.png';
                          }}
                        />
                        <Box
                          className="image-actions"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            borderRadius: '0 0 0 4px'
                          }}
                        >
                          <IconButton 
                            size="small" 
                            color="error"
                            disabled={deletingImageIndex === index}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleRemoveAdditionalImage(index);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            sx={{ p: 0.5 }}
                          >
                            {deletingImageIndex === index ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
                
                {/* Selected Image Preview */}
                {selectedImageIndex >= 0 && selectedImageIndex < additionalImages.length && (
                  <Box 
                    sx={{ 
                      ...responsiveStyles.imageContainer,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Box
                      component="img"
                      src={additionalImages[selectedImageIndex].preview ? addNoCacheParam(additionalImages[selectedImageIndex].preview) : '/images/no-image.png'}
                      alt="Selected product image"
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/no-image.png';
                      }}
                    />
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={responsiveStyles.button}
                  size="small"
                >
                  เพิ่มรูปภาพเพิ่มเติม
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    multiple
                    onChange={handleAdditionalImageUpload}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  สามารถเพิ่มรูปภาพได้หลายรูป
                </Typography>
              </Paper>
              
              <Typography variant="subtitle1" sx={responsiveStyles.sectionTitle}>
                สถานะสินค้า
              </Typography>
              
              <Paper elevation={0} variant="outlined" sx={{ p: 2, width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.productStatus === 'on'}
                      onChange={handleStatusChange}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {formData.productStatus === 'on' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Typography>
                  }
                  sx={{ width: '100%' }}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  สินค้าที่ปิดใช้งานจะไม่แสดงในหน้าร้านค้า
                </Typography>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.neutral', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {!isNewProduct && (
            <Button 
              onClick={() => setDeleteConfirmOpen(true)} 
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' }, order: { xs: 3, sm: 1 } }}
            >
              ลบสินค้า
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, order: { xs: 2, sm: 2 } }}>
            <Button 
              onClick={onClose} 
              color="inherit" 
              size="small"
              sx={{ flex: { xs: 1, sm: 'none' } }}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              startIcon={<SaveIcon />}
              size="small"
              sx={{ flex: { xs: 2, sm: 'none' } }}
            >
              {isNewProduct ? 'เพิ่มสินค้า' : 'บันทึก'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, p: { xs: 1.5, sm: 2 } }}>
          <WarningIcon color="error" />
          ยืนยันการลบสินค้า
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="body1" gutterBottom>
            คุณต้องการลบสินค้า "{formData.productName}" ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="error.main">
            การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลทั้งหมดของสินค้านี้จะถูกลบออกจากระบบ
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            color="inherit"
            size="small"
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            size="small"
            sx={{ flex: { xs: 2, sm: 'none' } }}
          >
            ยืนยันการลบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
