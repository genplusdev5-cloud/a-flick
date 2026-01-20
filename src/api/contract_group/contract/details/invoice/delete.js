import api from '@/utils/axiosInstance'

export default function deleteInvoice(id) {
  return api.patch('invoice-delete/', { id })
}
