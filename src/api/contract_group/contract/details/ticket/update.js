import api from '@/utils/axiosInstance'

export default function updateTicket(id, payload) {
  return api.put(`ticket-update/?id=${id}`, payload)
}
