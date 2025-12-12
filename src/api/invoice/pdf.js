// src/api/invoice/pdf.js
import api from '@/utils/axiosInstance'

export const getInvoicePDF = async id => {
  const res = await api.get(`/invoice-pdf/?id=${id}`)
  return res.data // This will now be JSON
}
