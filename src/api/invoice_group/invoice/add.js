import api from '@/utils/axiosInstance'

export const addInvoice = async data => {
  const res = await api.post(`invoice-add/`, data)
  return res.data
}
