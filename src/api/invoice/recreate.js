import api from '@/utils/axiosInstance'

export const recreateInvoice = async data => {
  const res = await api.post(`invoice-recreate/`, data)
  return res.data
}
