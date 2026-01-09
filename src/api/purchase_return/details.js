import api from '@/utils/axiosInstance'

export const getPurchaseReturnDetails = async ({ id, type = 'tm' }) => {
  const url = type === 'tx' ? 'tx-purchase_return-details' : 'tm-purchase_return-details'
  const res = await api.get(`${url}/?id=${id}`)
  return res.data
}
