import api from '@/utils/axiosInstance'

export const getTicketTechnicianList = params => {
  return api.get('ticket_technician-list/', { params })
}
