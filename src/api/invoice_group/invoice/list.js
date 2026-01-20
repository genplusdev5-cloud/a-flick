import api from '@/utils/axiosInstance'

export const getInvoiceList = async params => {
  const res = await api.get('invoice-list/', { params }) // 👈 NOT "invoice/"
  return res.data
}
