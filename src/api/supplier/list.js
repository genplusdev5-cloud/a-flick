import api from '@/utils/axiosInstance'

export const getSupplierList = async () => {
  return api.get('supplier-list/')
}
