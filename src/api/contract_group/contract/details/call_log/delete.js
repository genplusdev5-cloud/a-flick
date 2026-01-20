// api/call_log/delete.js
import api from '@/utils/axiosInstance'

export default function deleteCallLog(id) {
  return api.patch('call_log-delete/', null, {
    params: { id }
  })
}
