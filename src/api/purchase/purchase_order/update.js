import api from '@/utils/axiosInstance'

export const updatePurchaseOrder = async ({ id, payload }) => {
  const res = await api.put(`purchase_order-update/?id=${id}`, payload)
  return res.data
}
