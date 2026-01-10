import api from '@/utils/axiosInstance'

export const updateTicketTechnician = (id, data) => {
  return api.put('ticket_technician-update/', data, {
    params: { id }
  })
}
