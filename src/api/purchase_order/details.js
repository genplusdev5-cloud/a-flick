import api from '@/utils/axiosInstance'

export const getPurchaseOrderDetails = async ({ id, type = 'tm' }) => {
  const url = type === 'tx' ? `tx-purchase_order-details?id=${id}` : `tm-purchase_order-details?id=${id}`

  const res = await api.get(url)
  return res.data
}
