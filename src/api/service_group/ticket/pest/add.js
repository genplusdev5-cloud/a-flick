import api from '@/utils/axiosInstance'

export const addTicketPest = data => {
  return api.post('ticket_pest-add/', data)
}
