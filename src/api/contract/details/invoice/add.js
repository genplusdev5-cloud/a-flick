import api from '@/utils/axiosInstance'

export default function addInvoice(data) {
  return api.post('invoice-add/', data)
}
