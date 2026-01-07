import api from '@/utils/axiosInstance'

export const updatePurchaseOrder = async ({ id, payload, type = 'tm' }) => {
  const url = type === 'tx' ? `tx-purchase_order-update/?id=${id}` : `purchase_order-update/?id=${id}`
  const res = await api.put(url, payload)
  return res.data
}
