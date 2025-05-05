'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  MenuItem, 
  Button, 
  Stack,
  InputAdornment,
  Divider,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ClearIcon from '@mui/icons-material/Clear';

interface FiltersProps {
  status: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
  paymentStatus: string;
  hasSlip: string;
}

interface OrderFiltersProps {
  filters: FiltersProps;
  onFilterChange: (filters: FiltersProps) => void;
}

// สถานะคำสั่งซื้อ Map
const orderStatusMap: Record<string, string> = {
  'PENDING': 'รอดำเนินการ',
  'PROCESSING': 'กำลังดำเนินการ',
  'PAID': 'ชำระเงินแล้ว',
  'SHIPPED': 'จัดส่งแล้ว',
  'DELIVERED': 'จัดส่งสำเร็จ',
  'CANCELLED': 'ยกเลิก'
};

// สถานะการชำระเงิน Map
const paymentStatusMap: Record<string, string> = {
  'PENDING': 'รอการชำระเงิน',
  'CONFIRMED': 'ยืนยันการชำระเงินแล้ว',
  'REJECTED': 'ปฏิเสธการชำระเงิน'
};

export default function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FiltersProps>(filters);
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);
  
  // ปรับปรุง localFilters เมื่อ props filters เปลี่ยนแปลง
  useEffect(() => {
    
    setLocalFilters(filters);
    
    // คำนวณจำนวนตัวกรองที่ใช้งานอยู่
    const count = Object.values(filters).filter(value => value !== '').length;
    setActiveFiltersCount(count);
  }, [filters]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    // เรียกใช้ onFilterChange ทันทีเมื่อมีการเปลี่ยนแปลงค่า
    onFilterChange(newFilters);
    
  };
  
  // Reset filters
  const resetFilters = () => {
    const resetFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
      paymentStatus: '',
      hasSlip: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  // ล้างตัวกรองเฉพาะช่อง
  const clearSingleFilter = (filterName: keyof FiltersProps) => {
    const newFilters = { ...localFilters, [filterName]: '' };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        gap: 1
      }}>
        <FilterListIcon color="primary" />
        <Typography variant="h6" component="h2">
          ค้นหาและกรองคำสั่งซื้อ
        </Typography>
        {activeFiltersCount > 0 && (
          <Chip 
            label={`${activeFiltersCount} ตัวกรอง`} 
            size="small" 
            color="primary" 
            sx={{ ml: 'auto' }} 
          />
        )}
      </Box>
      
      <Stack spacing={2.5}>
        {/* Search */}
        <TextField
          fullWidth
          id="searchTerm"
          name="searchTerm"
          label="ค้นหา"
          variant="outlined"
          size="small"
          value={localFilters.searchTerm}
          onChange={handleInputChange}
          placeholder="เลขที่คำสั่งซื้อ, ชื่อ, อีเมล"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: localFilters.searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('searchTerm')}
                  edge="end"
                  aria-label="clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        {/* Status filter */}
        <TextField
          select
          fullWidth
          id="status"
          name="status"
          label="สถานะคำสั่งซื้อ"
          variant="outlined"
          size="small"
          value={localFilters.status}
          onChange={handleInputChange}
          InputProps={{
            endAdornment: localFilters.status ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('status')}
                  edge="end"
                  aria-label="clear status"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          <MenuItem value="PENDING">รอดำเนินการ</MenuItem>
          <MenuItem value="PROCESSING">กำลังดำเนินการ</MenuItem>
          <MenuItem value="PAID">ชำระเงินแล้ว</MenuItem>
          <MenuItem value="SHIPPED">จัดส่งแล้ว</MenuItem>
          <MenuItem value="DELIVERED">จัดส่งสำเร็จ</MenuItem>
          <MenuItem value="CANCELLED">ยกเลิก</MenuItem>
        </TextField>
        
        {/* Payment Status filter */}
        <TextField
          select
          fullWidth
          id="paymentStatus"
          name="paymentStatus"
          label="สถานะการชำระเงิน"
          variant="outlined"
          size="small"
          value={localFilters.paymentStatus}
          onChange={handleInputChange}
          InputProps={{
            endAdornment: localFilters.paymentStatus ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('paymentStatus')}
                  edge="end"
                  aria-label="clear payment status"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          <MenuItem value="PENDING">รอการชำระเงิน</MenuItem>
          <MenuItem value="CONFIRMED">ยืนยันการชำระเงินแล้ว</MenuItem>
          <MenuItem value="REJECTED">ปฏิเสธการชำระเงิน</MenuItem>
        </TextField>
        
        {/* Has Slip filter */}
        <TextField
          select
          fullWidth
          id="hasSlip"
          name="hasSlip"
          label="หลักฐานการโอนเงิน"
          variant="outlined"
          size="small"
          value={localFilters.hasSlip}
          onChange={handleInputChange}
          InputProps={{
            endAdornment: localFilters.hasSlip ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('hasSlip')}
                  edge="end"
                  aria-label="clear has slip"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          <MenuItem value="yes">มีหลักฐานการโอนเงิน</MenuItem>
          <MenuItem value="no">ไม่มีหลักฐานการโอนเงิน</MenuItem>
        </TextField>
        
        {/* Date range */}
        <TextField
          fullWidth
          id="dateFrom"
          name="dateFrom"
          label="วันที่เริ่มต้น"
          type="date"
          variant="outlined"
          size="small"
          value={localFilters.dateFrom}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: localFilters.dateFrom ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('dateFrom')}
                  edge="end"
                  aria-label="clear date from"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        <TextField
          fullWidth
          id="dateTo"
          name="dateTo"
          label="วันที่สิ้นสุด"
          type="date"
          variant="outlined"
          size="small"
          value={localFilters.dateTo}
          onChange={handleInputChange}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: localFilters.dateTo ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => clearSingleFilter('dateTo')}
                  edge="end"
                  aria-label="clear date to"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        {/* แสดงตัวกรองที่ใช้งานอยู่ */}
        {activeFiltersCount > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
            {localFilters.status && (
              <Chip 
                label={`สถานะ: ${orderStatusMap[localFilters.status]}`}
                size="small"
                onDelete={() => clearSingleFilter('status')}
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.paymentStatus && (
              <Chip 
                label={`การชำระเงิน: ${paymentStatusMap[localFilters.paymentStatus]}`}
                size="small"
                onDelete={() => clearSingleFilter('paymentStatus')}
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.searchTerm && (
              <Chip 
                label={`ค้นหา: ${localFilters.searchTerm}`}
                size="small"
                onDelete={() => clearSingleFilter('searchTerm')}
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.dateFrom && (
              <Chip 
                label={`จากวันที่: ${localFilters.dateFrom}`}
                size="small"
                onDelete={() => clearSingleFilter('dateFrom')}
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.dateTo && (
              <Chip 
                label={`ถึงวันที่: ${localFilters.dateTo}`}
                size="small"
                onDelete={() => clearSingleFilter('dateTo')}
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.hasSlip && (
              <Chip 
                label={`หลักฐานการโอนเงิน: ${localFilters.hasSlip === 'yes' ? 'มี' : 'ไม่มี'}`}
                size="small"
                onDelete={() => clearSingleFilter('hasSlip')}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        {/* ปุ่มรีเซ็ต */}
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={resetFilters}
          startIcon={<RestartAltIcon />}
          sx={{ py: 1 }}
          disabled={activeFiltersCount === 0}
        >
          รีเซ็ตตัวกรอง
        </Button>
      </Stack>
    </Box>
  );
}
