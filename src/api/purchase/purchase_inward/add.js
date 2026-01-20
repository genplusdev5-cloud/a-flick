import api from '@/utils/axiosInstance'

export const addPurchaseInward = async payload => {
  const res = await api.post('purchase_inward-add/', payload)
  return res.data
}
