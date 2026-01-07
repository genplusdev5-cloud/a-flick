import api from '@/utils/axiosInstance'

export const getPurchaseOrderList = async (params = {}) => {
  const res = await api.get('purchase_order-list/', { params })
  return res.data
}
