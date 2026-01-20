// api/call_log/list.js
import api from '@/utils/axiosInstance'

export default function listCallLogs(params = {}) {
  return api.get('call_log-list/', { params })
}
