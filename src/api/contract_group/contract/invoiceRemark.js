import api from '@/utils/axiosInstance'

/**
 * 🔹 Generate Invoice Remarks
 * POST invoice_remark/
 */
export const getInvoiceRemark = async payload => {
  const res = await api.post('invoice_remark/', payload)
  return res.data
}
