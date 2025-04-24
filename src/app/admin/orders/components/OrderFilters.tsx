'use client';

import { useState } from 'react';
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
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FiltersProps {
  status: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

interface OrderFiltersProps {
  filters: FiltersProps;
  onFilterChange: (filters: FiltersProps) => void;
}

export default function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FiltersProps>(filters);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    const resetFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
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
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          <MenuItem value="PENDING">รอดำเนินการ</MenuItem>
          <MenuItem value="PROCESSING">กำลังดำเนินการ</MenuItem>
          <MenuItem value="PAID">ชำระเงินแล้ว</MenuItem>
          <MenuItem value="SHIPPED">จัดส่งแล้ว</MenuItem>
          <MenuItem value="DELIVERED">จัดส่งสำเร็จ</MenuItem>
          <MenuItem value="CANCELLED">ยกเลิก</MenuItem>
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
        />
        
        <Divider sx={{ my: 1 }} />
        
        {/* Action buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={applyFilters}
            startIcon={<SearchIcon />}
            sx={{ py: 1 }}
          >
            ค้นหา
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={resetFilters}
            startIcon={<RestartAltIcon />}
            sx={{ py: 1 }}
          >
            รีเซ็ต
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
