import api from '@/utils/axiosInstance'

export const updatePurchaseInward = async ({ id, payload }) => {
  const res = await api.put(`purchase_inward-update/?id=${id}`, payload)
  return res.data
}
