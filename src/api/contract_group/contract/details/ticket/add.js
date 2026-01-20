import api from '@/utils/axiosInstance'

export default function addTicket(payload) {
  // ✅ Correct API endpoint
  return api.post('schedule/', payload)
}
