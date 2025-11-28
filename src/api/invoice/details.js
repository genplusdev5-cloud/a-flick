import api from '@/utils/axiosInstance'

export const getInvoiceDetails = async id => {
  const res = await api.get(`invoice-details/?id=${id}`)
  return res.data
}
