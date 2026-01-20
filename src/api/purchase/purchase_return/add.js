import api from '@/utils/axiosInstance'

export const addPurchaseReturn = async payload => {
  const res = await api.post('purchase_return-add/', payload)
  return res.data
}
