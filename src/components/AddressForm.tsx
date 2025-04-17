"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography, 
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import Grid from '@mui/material/Grid';

// กำหนดรูปแบบข้อมูลสำหรับพื้นที่
interface Location {
  id: number;
  nameTh: string;
  nameEn: string;
}

// กำหนดรูปแบบตำบลที่มี zipCode เพิ่มเติม
interface Tambon extends Location {
  zipCode: number;
}

interface AddressFormProps {
  onAddressChange?: (address: {
    receiverName?: string;
    receiverLastname?: string;
    provinceId?: number;
    amphureId?: number;
    tambonId?: number;
    zipCode?: string;
    addressLine?: string;
  }) => void;
  defaultValues?: {
    receiverName?: string;
    receiverLastname?: string;
    provinceId?: number;
    amphureId?: number;
    tambonId?: number;
    zipCode?: string;
    addressLine?: string;
  };
  hideReceiverNameFields?: boolean;
}

export default function AddressForm({ onAddressChange, defaultValues, hideReceiverNameFields = false }: AddressFormProps) {
  // สร้าง state สำหรับเก็บข้อมูล
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [amphures, setAmphures] = useState<Location[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  
  // สร้าง state สำหรับเก็บค่าที่เลือก
  const [receiverName, setReceiverName] = useState<string>(defaultValues?.receiverName || '');
  const [receiverLastname, setReceiverLastname] = useState<string>(defaultValues?.receiverLastname || '');
  const [selectedProvince, setSelectedProvince] = useState<number | ''>(defaultValues?.provinceId || '');
  const [selectedAmphure, setSelectedAmphure] = useState<number | ''>(defaultValues?.amphureId || '');
  const [selectedTambon, setSelectedTambon] = useState<number | ''>(defaultValues?.tambonId || '');
  const [zipCode, setZipCode] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>(defaultValues?.addressLine || '');
  
  // สร้าง state สำหรับแสดงสถานะการโหลด
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingAmphures, setLoadingAmphures] = useState<boolean>(false);
  const [loadingTambons, setLoadingTambons] = useState<boolean>(false);

  // เพิ่ม ref เพื่อป้องกันการทำงานซ้ำซ้อน
  const initializedRef = useRef(false);
  
  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchProvinces();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // โหลดข้อมูลจังหวัดเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    fetchProvinces();
    
    // ตั้งค่าเริ่มต้นถ้ามี
    if (defaultValues) {
      if (defaultValues.receiverName) {
        setReceiverName(defaultValues.receiverName);
      }
      if (defaultValues.receiverLastname) {
        setReceiverLastname(defaultValues.receiverLastname);
      }
      if (defaultValues.addressLine) {
        setAddressLine(defaultValues.addressLine);
      }
    }
  }, []);

  // โหลดข้อมูลอำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    if (selectedProvince) {
      fetchAmphures(selectedProvince as number);
      // รีเซ็ตค่าอำเภอและตำบลเมื่อเปลี่ยนจังหวัด
      setSelectedAmphure('');
      setSelectedTambon('');
      setZipCode('');
    } else {
      setAmphures([]);
      setTambons([]);
    }
  }, [selectedProvince]);

  // โหลดข้อมูลตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    if (selectedAmphure) {
      fetchTambons(selectedAmphure as number);
      // รีเซ็ตค่าตำบลเมื่อเปลี่ยนอำเภอ
      setSelectedTambon('');
      setZipCode('');
    } else {
      setTambons([]);
    }
  }, [selectedAmphure]);

  // อัปเดตรหัสไปรษณีย์เมื่อเลือกตำบล
  useEffect(() => {
    if (selectedTambon) {
      const tambon = tambons.find(t => t.id === selectedTambon);
      if (tambon) {
        setZipCode(tambon.zipCode.toString());
        
        // ส่งข้อมูลที่อยู่กลับไปยัง parent component
        const selectedProvinceObj = provinces.find(p => p.id === selectedProvince);
        const selectedAmphureObj = amphures.find(a => a.id === selectedAmphure);
        
        sendAddressUpdate({
          receiverName,
          receiverLastname,
          provinceId: selectedProvince as number,
          provinceName: selectedProvinceObj ? selectedProvinceObj.nameTh : '',
          amphureId: selectedAmphure as number,
          amphureName: selectedAmphureObj ? selectedAmphureObj.nameTh : '',
          tambonId: selectedTambon as number,
          tambonName: tambon.nameTh,
          zipCode: tambon.zipCode.toString(),
          addressLine
        });
      }
    } else {
      setZipCode('');
    }
  }, [selectedTambon, tambons]);
  
  // เพิ่ม useEffect เพื่ออัพเดทค่า zipCode จาก defaultValues ถ้ามี
  useEffect(() => {
    if (defaultValues?.tambonId && tambons.length > 0) {
      // หาตำบลจาก tambons
      const tambon = tambons.find(t => t.id === defaultValues.tambonId);
      if (tambon) {
        setZipCode(tambon.zipCode.toString());
        // ตั้งค่า selectedTambon ด้วยเพื่อให้แน่ใจว่าถูกเลือก
        setSelectedTambon(defaultValues.tambonId as number);
      } else if (defaultValues.zipCode) {
        // ถ้าไม่พบตำบล แต่มีรหัสไปรษณีย์ ให้ใช้ค่าจาก defaultValues
        setZipCode(defaultValues.zipCode);
      }
    }
  }, [defaultValues?.tambonId, defaultValues?.zipCode, tambons]);

  // ตั้งค่าค่าเริ่มต้น (ถ้ามี)
  useEffect(() => {
    if (!defaultValues) return;
    
    // ตรวจสอบว่า defaultValues มีการเปลี่ยนแปลงหรือไม่
    const prevDefaultValues = prevDefaultValuesRef.current;
    const hasDefaultValuesChanged = 
      !prevDefaultValues ||
      prevDefaultValues.receiverName !== defaultValues.receiverName ||
      prevDefaultValues.receiverLastname !== defaultValues.receiverLastname ||
      prevDefaultValues.provinceId !== defaultValues.provinceId ||
      prevDefaultValues.amphureId !== defaultValues.amphureId ||
      prevDefaultValues.tambonId !== defaultValues.tambonId ||
      prevDefaultValues.addressLine !== defaultValues.addressLine;
    
    // อัพเดตค่าเฉพาะเมื่อ defaultValues เปลี่ยนแปลง
    if (hasDefaultValuesChanged) {
      prevDefaultValuesRef.current = {...defaultValues};
      
      if (defaultValues.receiverName !== undefined && defaultValues.receiverName !== receiverName) {
        setReceiverName(defaultValues.receiverName);
      }
      if (defaultValues.receiverLastname !== undefined && defaultValues.receiverLastname !== receiverLastname) {
        setReceiverLastname(defaultValues.receiverLastname);
      }
      if (defaultValues.addressLine !== undefined && defaultValues.addressLine !== addressLine) {
        setAddressLine(defaultValues.addressLine);
      }
      
      // จัดการกับจังหวัด/อำเภอ/ตำบล แยกจากฟิลด์อื่น
      if (defaultValues.provinceId && defaultValues.provinceId !== selectedProvince) {
        setSelectedProvince(defaultValues.provinceId);
        
        // ถ้ามี amphureId ให้โหลดอำเภอและตั้งค่า
        if (defaultValues.amphureId) {
          fetchAmphures(defaultValues.provinceId);
          setSelectedAmphure(defaultValues.amphureId);
          
          // ถ้ามี tambonId ให้โหลดตำบลและตั้งค่า
          if (defaultValues.tambonId) {
            fetchTambons(defaultValues.amphureId).then(() => {
              // หลังจากโหลดตำบลเสร็จแล้ว ให้ตั้งค่า selectedTambon
              setSelectedTambon(defaultValues.tambonId as number);
            });
          }
        }
      }
    }
  }, [defaultValues, receiverName, receiverLastname, addressLine, selectedProvince]);

  // สร้าง memoized callback สำหรับการส่งข้อมูลไปยัง parent component
  const sendAddressUpdate = useCallback((newData: any) => {
    if (onAddressChange) {
      onAddressChange(newData);
    }
  }, [onAddressChange]);

  // ฟังก์ชันสำหรับดึงข้อมูลจังหวัด
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch('/api/location/provinces');
      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }
      const data = await response.json();
      setProvinces(data);

      // ถ้ามีค่าเริ่มต้นของจังหวัด ให้โหลดอำเภอด้วย
      if (defaultValues?.provinceId && defaultValues.provinceId) {
        setSelectedProvince(defaultValues.provinceId);
        fetchAmphures(defaultValues.provinceId);
        
        // ถ้ามีค่าเริ่มต้นของอำเภอ ให้ตั้งค่าและโหลดตำบลด้วย
        if (defaultValues.amphureId) {
          setSelectedAmphure(defaultValues.amphureId);
          
          // ถ้ามีค่าเริ่มต้นของตำบล ให้โหลดตำบลและตั้งค่า
          if (defaultValues.tambonId) {
            fetchTambons(defaultValues.amphureId).then(() => {
              // หลังจากโหลดตำบลเสร็จแล้ว ให้ตั้งค่า selectedTambon
              setSelectedTambon(defaultValues.tambonId as number);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลอำเภอ
  const fetchAmphures = async (provinceId: number) => {
    setLoadingAmphures(true);
    try {
      const response = await fetch(`/api/location/amphures?provinceId=${provinceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch amphures');
      }
      const data = await response.json();
      setAmphures(data);
    } catch (error) {
      console.error('Error fetching amphures:', error);
    } finally {
      setLoadingAmphures(false);
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลตำบล
  const fetchTambons = async (amphureId: number) => {
    setLoadingTambons(true);
    try {
      const response = await fetch(`/api/location/tambons?amphureId=${amphureId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tambons');
      }
      const data = await response.json();
      setTambons(data);
      
      // ถ้ามี defaultValues.tambonId หลังจากโหลดข้อมูล ให้ตั้งค่า
      if (defaultValues?.tambonId) {
        setSelectedTambon(defaultValues.tambonId as number);
        
        // หา zipCode ด้วย
        const tambon = data.find((t: Tambon) => t.id === defaultValues.tambonId);
        if (tambon) {
          setZipCode(tambon.zipCode.toString());
        } else if (defaultValues.zipCode) {
          setZipCode(defaultValues.zipCode);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching tambons:', error);
      return [];
    } finally {
      setLoadingTambons(false);
    }
  };

  // จัดการการเปลี่ยนแปลงชื่อผู้รับ
  const handleReceiverNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setReceiverName(newValue);
    
    // ส่งข้อมูลเมื่อมีการเปลี่ยนแปลง
    sendAddressUpdate({
      receiverName: newValue,
      receiverLastname,
      provinceId: selectedProvince ? Number(selectedProvince) : undefined,
      amphureId: selectedAmphure ? Number(selectedAmphure) : undefined,
      tambonId: selectedTambon ? Number(selectedTambon) : undefined,
      zipCode,
      addressLine,
    });
  };

  // จัดการการเปลี่ยนแปลงนามสกุลผู้รับ
  const handleReceiverLastnameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setReceiverLastname(newValue);
    
    // ส่งข้อมูลเมื่อมีการเปลี่ยนแปลง
    sendAddressUpdate({
      receiverName,
      receiverLastname: newValue,
      provinceId: selectedProvince ? Number(selectedProvince) : undefined,
      amphureId: selectedAmphure ? Number(selectedAmphure) : undefined,
      tambonId: selectedTambon ? Number(selectedTambon) : undefined,
      zipCode,
      addressLine,
    });
  };

  // จัดการการเปลี่ยนแปลงจังหวัด
  const handleProvinceChange = (event: SelectChangeEvent<typeof selectedProvince>) => {
    const provinceId = event.target.value as number;
    setSelectedProvince(provinceId);
    
    // ส่งข้อมูลกลับไปยัง parent component
    const selectedProvinceObj = provinces.find(p => p.id === provinceId);
    sendAddressUpdate({
      receiverName,
      receiverLastname,
      provinceId: provinceId,
      provinceName: selectedProvinceObj ? selectedProvinceObj.nameTh : '',
      addressLine
    });
  };

  // จัดการการเปลี่ยนแปลงอำเภอ
  const handleAmphureChange = (event: SelectChangeEvent<typeof selectedAmphure>) => {
    const amphureId = event.target.value as number;
    setSelectedAmphure(amphureId);
    
    // ส่งข้อมูลกลับไปยัง parent component
    const selectedProvinceObj = provinces.find(p => p.id === selectedProvince);
    const selectedAmphureObj = amphures.find(a => a.id === amphureId);
    sendAddressUpdate({
      receiverName,
      receiverLastname,
      provinceId: selectedProvince as number,
      provinceName: selectedProvinceObj ? selectedProvinceObj.nameTh : '',
      amphureId: amphureId,
      amphureName: selectedAmphureObj ? selectedAmphureObj.nameTh : '',
      addressLine
    });
  };

  // จัดการการเปลี่ยนแปลงตำบล
  const handleTambonChange = (event: SelectChangeEvent<typeof selectedTambon>) => {
    const tambonId = event.target.value as number;
    setSelectedTambon(tambonId);
    
    // ที่เหลือจะดำเนินการใน useEffect ที่คอยติดตามการเปลี่ยนแปลงของ selectedTambon
  };

  // จัดการการเปลี่ยนแปลงที่อยู่
  const handleAddressLineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAddressLine = event.target.value;
    setAddressLine(newAddressLine);
    
    // ส่งข้อมูลที่อยู่กลับไปยัง parent component
    const selectedProvinceObj = provinces.find(p => p.id === selectedProvince);
    const selectedAmphureObj = amphures.find(a => a.id === selectedAmphure);
    const selectedTambonObj = tambons.find(t => t.id === selectedTambon);
    
    sendAddressUpdate({
      receiverName,
      receiverLastname,
      provinceId: selectedProvince as number,
      provinceName: selectedProvinceObj ? selectedProvinceObj.nameTh : '',
      amphureId: selectedAmphure as number,
      amphureName: selectedAmphureObj ? selectedAmphureObj.nameTh : '',
      tambonId: selectedTambon as number,
      tambonName: selectedTambonObj ? selectedTambonObj.nameTh : '',
      zipCode,
      addressLine: newAddressLine
    });
  };

  // เพิ่ม ref เพื่อเก็บค่า defaultValues เดิม
  const prevDefaultValuesRef = useRef<typeof defaultValues>({});

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        ข้อมูลผู้รับ
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {/* ชื่อ-นามสกุลผู้รับ - แสดงเฉพาะเมื่อไม่ได้เลือกซ่อน */}
        {!hideReceiverNameFields && (
          <>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="ชื่อผู้รับ"
                value={receiverName}
                onChange={handleReceiverNameChange}
                placeholder="ชื่อผู้รับสินค้า"
                required
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                fullWidth
                label="นามสกุลผู้รับ"
                value={receiverLastname}
                onChange={handleReceiverLastnameChange}
                placeholder="นามสกุลผู้รับสินค้า"
                required
              />
            </Box>
          </>
        )}
        
        {/* ที่อยู่ */}
        <Box sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="ที่อยู่"
            value={addressLine}
            onChange={handleAddressLineChange}
            multiline
            rows={2}
            placeholder="บ้านเลขที่ หมู่ ถนน ซอย"
            required
          />
        </Box>
        
        {/* จังหวัด */}
        <Box sx={{ width: { xs: '100%', sm: '32%', lg: '48%'} }}>
          <FormControl fullWidth required>
            <InputLabel id="province-label">จังหวัด</InputLabel>
            <Select
              labelId="province-label"
              value={selectedProvince}
              onChange={handleProvinceChange}
              label="จังหวัด"
              disabled={loadingProvinces}
            >
              <MenuItem value="" sx={{ color: 'text.secondary' }}>
                เลือกจังหวัด
              </MenuItem>
              {provinces.map((province) => (
                <MenuItem key={province.id} value={province.id}>
                  {province.nameTh}
                </MenuItem>
              ))}
            </Select>
            {loadingProvinces && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </FormControl>
        </Box>
        
        {/* อำเภอ */}
        <Box sx={{ width: { xs: '100%', sm: '32%' , lg: '48%'} }}>
          <FormControl fullWidth disabled={!selectedProvince || loadingAmphures} required>
            <InputLabel id="amphure-label">อำเภอ/เขต</InputLabel>
            <Select
              labelId="amphure-label"
              value={selectedAmphure}
              onChange={handleAmphureChange}
              label="อำเภอ/เขต"
            >
              <MenuItem value="" sx={{ color: 'text.secondary' }}>
                เลือกอำเภอ/เขต
              </MenuItem>
              {amphures.map((amphure) => (
                <MenuItem key={amphure.id} value={amphure.id}>
                  {amphure.nameTh}
                </MenuItem>
              ))}
            </Select>
            {loadingAmphures && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </FormControl>
        </Box>
        
        {/* ตำบล */}
        <Box sx={{ width: { xs: '100%', sm: '32%' , lg: '48%'} }}>
          <FormControl fullWidth disabled={!selectedAmphure || loadingTambons} required>
            <InputLabel id="tambon-label">ตำบล/แขวง</InputLabel>
            <Select
              labelId="tambon-label"
              value={selectedTambon}
              onChange={handleTambonChange}
              label="ตำบล/แขวง"
            >
              <MenuItem value="" sx={{ color: 'text.secondary' }}>
                เลือกตำบล/แขวง
              </MenuItem>
              {tambons.map((tambon) => (
                <MenuItem key={tambon.id} value={tambon.id}>
                  {tambon.nameTh}
                </MenuItem>
              ))}
            </Select>
            {loadingTambons && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </FormControl>
        </Box>
        
        {/* รหัสไปรษณีย์ */}
        <Box sx={{ width: { xs: '100%', sm: '32%' , lg: '48%'} }}>
          <TextField
            fullWidth
            label="รหัสไปรษณีย์"
            value={zipCode}
            InputProps={{
              readOnly: true,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
} 