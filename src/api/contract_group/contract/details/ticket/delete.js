import api from '@/utils/axiosInstance'

export default function deleteTicket(id) {
  return api.patch('ticket-delete/', { id })
}
