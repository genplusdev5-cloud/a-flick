// api/call_log/update.js
import api from '@/utils/axiosInstance'

export default function updateCallLog(id, data) {
  return api.put('call_log-update/', data, {
    params: { id }
  })
}
