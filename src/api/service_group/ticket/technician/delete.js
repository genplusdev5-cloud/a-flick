import api from '@/utils/axiosInstance'

export const deleteTicketTechnician = id => {
  return api.patch('ticket_technician-delete/', null, {
    params: { id }
  })
}
