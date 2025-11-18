import api from '@/utils/axiosInstance'

export default function updateInvoice(id, data) {
  return api.put('invoice-update/', { id, ...data })
}
