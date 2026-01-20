import api from '@/utils/axiosInstance'

// PATCH – delete supplier contact (soft delete)
export const deleteSupplierContact = async id => {
  const res = await api.patch(`supplier-contact-delete/?id=${id}`)
  return res.data
}
