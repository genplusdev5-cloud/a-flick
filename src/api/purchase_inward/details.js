import api from '@/utils/axiosInstance'

export const getPurchaseInwardDetails = async ({ id, type = 'tm' }) => {
  const url = type === 'tx' ? 'tx-purchase_inward-details' : 'tm-purchase_inward-details'

  const res = await api.get(`${url}?id=${id}`)
  return res.data
}
