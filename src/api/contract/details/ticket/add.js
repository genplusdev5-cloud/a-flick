import api from '@/utils/axiosInstance'

export default function addTicket(payload) {
  return api.post('ticket-add/', payload)
}
