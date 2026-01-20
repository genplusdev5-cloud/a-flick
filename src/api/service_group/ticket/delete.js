import api from '@/utils/axiosInstance'

// PATCH {{base_url}}ticket-delete/
export const deleteTicket = async payload => {
  // backend la id array / single id eduthukkum – unga API-kku match pannunga
  const res = await api.patch('ticket-delete/', payload)
  return res.data
}
