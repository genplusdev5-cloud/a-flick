import api from '@/utils/axiosInstance'

// PUT {{base_url}}ticket-update/?id=1015
export const updateTicket = async (id, payload) => {
  const res = await api.put('ticket-update/', payload, {
    params: { id }
  })
  return res.data
}
