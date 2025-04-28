'use client';

import { useState } from 'react';
import { Product } from '../client';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  TablePagination,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface PaginationProps {
  page: number;
  limit: number | string;
  totalItems: number;
  totalPages: number;
}

interface ProductListProps {
  products: Product[];
  pagination: PaginationProps;
  onPageChange: (page: number, limit?: number | string) => void;
  onProductSelect: (product: Product) => void;
  selectedProductId: string | null;
}

export default function ProductList({
  products,
  pagination,
  onPageChange,
  onProductSelect,
  selectedProductId
}: ProductListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // เพิ่ม local state สำหรับจัดการ rowsPerPage ที่เป็น number เท่านั้น
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    typeof pagination.limit === 'number' ? pagination.limit : 10
  );
  
  // Function to get status color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'on':
        return 'success';
      case 'off':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Function to translate status
  const translateStatus = (status: string | null) => {
    switch (status) {
      case 'on':
        return 'เปิดใช้งาน';
      case 'off':
        return 'ปิดใช้งาน';
      default:
        return status || '-';
    }
  };
  
  // Function to format price
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return `฿${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };
  
  return (
    <>
      {isMobile ? (
        /* Mobile View - Card Layout */
        <Box>
          {products.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="body1" color="text.secondary">
                ไม่พบข้อมูลสินค้า
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    borderColor: product.id === selectedProductId ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 1
                    }
                  }}
                  onClick={() => onProductSelect(product)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      {/* Product Image */}
                      <Box sx={{ width: '25%' }}>
                        {product.productImg ? (
                          <Box
                            component="img"
                            src={`/images/product/${product.productImg}`}
                            alt={product.productName || ''}
                            sx={{ 
                              width: '100%',
                              aspectRatio: '1/1',
                              objectFit: 'cover', 
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/100';
                            }}
                          />
                        ) : (
                          <Box
                            sx={{ 
                              width: '100%',
                              aspectRatio: '1/1',
                              bgcolor: 'background.neutral',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              ไม่มีรูป
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {/* Product Info */}
                      <Box sx={{ width: '75%' }}>
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" noWrap>
                            {product.productName || '-'}
                          </Typography>
                          
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              รหัส: {product.sku || '-'}
                            </Typography>
                            
                            <Chip 
                              size="small"
                              label={translateStatus(product.productStatus)}
                              color={getStatusColor(product.productStatus) as any}
                              variant="outlined"
                              sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                            />
                          </Stack>
                          
                          <Divider sx={{ my: 0.5 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {formatPrice(product.salesPrice)}
                              </Typography>
                              {product.originalPrice && product.originalPrice > (product.salesPrice || 0) && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ textDecoration: 'line-through' }}
                                >
                                  {formatPrice(product.originalPrice)}
                                </Typography>
                              )}
                            </Box>
                            
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={500}
                                color={product.stock && product.stock <= 0 ? 'error.main' : 'inherit'}
                              >
                                สต็อก: {product.stock !== null ? product.stock : '-'}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        /* Desktop View - Table Layout */
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.neutral' }}>
                <TableCell width={80}>รูปภาพ</TableCell>
                <TableCell>รหัสสินค้า</TableCell>
                <TableCell>ชื่อสินค้า</TableCell>
                <TableCell align="right">ราคา</TableCell>
                <TableCell align="right">สต็อก</TableCell>
                <TableCell align="center">สถานะ</TableCell>
                <TableCell align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      ไม่พบข้อมูลสินค้า
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow 
                    key={product.id}
                    hover
                    selected={product.id === selectedProductId}
                    onClick={() => onProductSelect(product)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {product.productImg ? (
                        <Box
                          component="img"
                          src={`/images/product/${product.productImg}`}
                          alt={product.productName || ''}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            objectFit: 'cover', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/40';
                          }}
                        />
                      ) : (
                        <Box
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'background.neutral',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            ไม่มีรูป
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {product.sku || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.productName || '-'}
                      </Typography>
                      {product.category && (
                        <Typography variant="caption" color="text.secondary">
                          {product.category}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack spacing={0.5} alignItems="flex-end">
                        <Typography variant="body2" fontWeight={500}>
                          {formatPrice(product.salesPrice)}
                        </Typography>
                        {product.originalPrice && product.originalPrice > (product.salesPrice || 0) && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {formatPrice(product.originalPrice)}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        color={product.stock && product.stock <= 0 ? 'error.main' : 'inherit'}
                      >
                        {product.stock !== null ? product.stock : '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.stockStatus || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        size="small"
                        label={translateStatus(product.productStatus)}
                        color={getStatusColor(product.productStatus) as any}
                        variant="outlined"
                        icon={product.productStatus === 'on' ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="แก้ไขสินค้า">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductSelect(product);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box component="div">
        <TablePagination
          component="div"
          count={pagination.totalItems}
          page={pagination.page - 1} // API uses 1-based indexing, MUI uses 0-based
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[
            10, 
            25, 
            50, 
            100,
            { label: 'แสดงทั้งหมด', value: -1 }
          ]}
          onPageChange={handleChangePage}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const newRowsPerPage = parseInt(value, 10);
            setRowsPerPage(newRowsPerPage);
            
            // ถ้าเป็น -1 (All) ให้ส่งค่าเป็น 'all'
            let newLimit: number | string = newRowsPerPage;
            if (newRowsPerPage === -1) {
              newLimit = 'all';
            }
            
            // ส่งค่า newLimit กลับไปยัง parent component
            onPageChange(1, newLimit);
          }}
          labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => 
            `${from}-${to} จาก ${count}`
          }
          labelRowsPerPage={isMobile ? "" : "แสดง:"}
          sx={{
            '.MuiTablePagination-selectLabel': {
              display: { xs: 'none', sm: 'block' }
            },
            '.MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            },
            '.MuiTablePagination-select': {
              paddingLeft: { xs: 0, sm: 1 }
            }
          }}
        />
      </Box>
    </>
  );
}
