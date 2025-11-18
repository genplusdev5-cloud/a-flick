import api from '@/utils/axiosInstance'

export default function listInvoices(params = {}) {
  return api.get('invoice-list/', { params })
}
