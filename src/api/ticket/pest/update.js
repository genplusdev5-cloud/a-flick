import api from '@/utils/axiosInstance'

export const updateTicketPest = (id, data) => {
  return api.put('ticket_pest-update/', data, {
    params: { id }
  })
}
