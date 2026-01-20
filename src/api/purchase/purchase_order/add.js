import api from '@/utils/axiosInstance'

export const addPurchaseOrder = async (payload, type = 'tm') => {
  const url = type === 'tx' ? 'tx-purchase_order-add/' : 'purchase_order-add/'
  const res = await api.post(url, payload)
  return res.data
}
