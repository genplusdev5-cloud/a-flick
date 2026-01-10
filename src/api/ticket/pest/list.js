import api from '@/utils/axiosInstance'

export const getTicketPestList = params => {
  return api.get('ticket_pest-list/', { params })
}
