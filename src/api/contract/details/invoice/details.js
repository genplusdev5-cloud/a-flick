import api from '@/utils/axiosInstance'

export default function getInvoiceDetails(id) {
  return api.get('invoice-details/', { params: { id } })
}
