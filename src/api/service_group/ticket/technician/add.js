import api from '@/utils/axiosInstance'

export const addTicketTechnician = data => {
  return api.post('ticket_technician-add/', data)
}
