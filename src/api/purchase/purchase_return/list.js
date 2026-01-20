import api from '@/utils/axiosInstance'

export const getPurchaseReturnList = async params => {
  const res = await api.get('purchase_return-list/', { params })
  return res.data
}
