import api from '@/utils/axiosInstance'

export const getTicketTechnicianDetails = id => {
  return api.get('ticket_technician-details/', {
    params: { id }
  })
}
