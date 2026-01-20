import api from '@/utils/axiosInstance'

export const deleteTicketPest = id => {
  return api.patch('ticket_pest-delete/', null, {
    params: { id }
  })
}
