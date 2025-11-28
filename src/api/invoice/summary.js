import api from '@/utils/axiosInstance'

export const getInvoiceSummary = async params => {
  const res = await api.get(`invoice-summary/`, { params })
  return res.data
}
