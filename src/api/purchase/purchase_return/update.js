import api from '@/utils/axiosInstance'

export const updatePurchaseReturn = async ({ id, payload }) => {
  const res = await api.put(`purchase_return-update/?id=${id}`, payload)
  return res.data
}
