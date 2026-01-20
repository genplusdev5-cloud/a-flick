import api from '@/utils/axiosInstance'

export const updateInvoice = async (id, data) => {
  const res = await api.put(`invoice-update/?id=${id}`, data)
  return res.data
}
