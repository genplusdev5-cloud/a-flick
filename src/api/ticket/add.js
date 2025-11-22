import api from '@/utils/axiosInstance'

// POST {{base_url}}ticket-add/
export const addTicket = async payload => {
  const res = await api.post('ticket-add/', payload)
  return res.data
}
