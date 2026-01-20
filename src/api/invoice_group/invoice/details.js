import api from '@/utils/axiosInstance'

export const getInvoiceDetails = async id => {
  const res = await api.get(`/invoice/?id=${id}`)
  return res.data // JSON
}
