import api from '@/utils/axiosInstance'

export const getInvoiceDropdowns = async (params = {}) => {
  const res = await api.get('invoice/', { params })
  return res.data
}
