import api from '@/utils/axiosInstance'

export const getTicketPestDetails = id => {
  return api.get('ticket_pest-details/', {
    params: { id }
  })
}
