import api from '@/utils/axiosInstance'

export const getPurchaseInwardList = async (params = {}) => {
  const res = await api.get('purchase_inward-list/', { params })
  return res.data
}
