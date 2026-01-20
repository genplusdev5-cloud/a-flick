import api from '@/utils/axiosInstance'

export const getInvoiceCount = async payload => {
  const res = await api.post('invoice-count/', payload)
  return res.data
}
