import api from '@/utils/axiosInstance'

export default function listTickets(params = {}) {
  return api.get('ticket-list/', { params })
}
