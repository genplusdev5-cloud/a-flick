import api from '@/utils/axiosInstance'

// GET {{base_url}}ticket-list/?contract_id=6010
export const getTicketList = async params => {
  const res = await api.get('ticket-list/', { params }) // params = { contract_id, page, page_size ... }
  return res.data
}
