import api from '@/utils/axiosInstance'

// GET {{base_url}}ticket-details/?id=1015
export const getTicketDetails = async id => {
  const res = await api.get('ticket-details/', {
    params: { id }
  })
  return res.data
}
