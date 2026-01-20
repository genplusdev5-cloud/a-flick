// api/call_log/add.js
import api from '@/utils/axiosInstance'

export default function addCallLog(data) {
  return api.post('call_log-add/', data)
}
