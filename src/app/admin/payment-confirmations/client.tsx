// ฟังก์ชันสำหรับการลบข้อมูล Payment Confirmation
const handleDeletePayment = async (id: string) => {
  if (!confirm('คุณต้องการลบข้อมูลการชำระเงินนี้ใช่หรือไม่?')) {
    return;
  }

  try {
    setLoading(true);
    const response = await fetch(`/api/payment-confirmation?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // อัพเดทข้อมูลในตารางโดยการดึงข้อมูลใหม่
      await fetchPaymentConfirmations();
      showSnackbar('ลบข้อมูลเรียบร้อยแล้ว', 'success');
    } else {
      const error = await response.json();
      showSnackbar(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
    }
  } catch (error) {
    console.error('Error deleting payment confirmation:', error);
    showSnackbar('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
  } finally {
    setLoading(false);
  }
};

// เพิ่มปุ่มลบในส่วนที่แสดงรายการ Payment Confirmation
// ค้นหาตำแหน่งที่มีการแสดงรายการและเพิ่มปุ่มลบ
<IconButton 
  size="small" 
  color="error" 
  onClick={() => handleDeletePayment(payment.id)}
  disabled={loading}
>
  <DeleteIcon fontSize="small" />
</IconButton> 