import api from '@/utils/axiosInstance'

export const deleteInvoice = async id => {
  const res = await api.patch(`invoice-delete/?id=${id}`)
  return res.data
}
