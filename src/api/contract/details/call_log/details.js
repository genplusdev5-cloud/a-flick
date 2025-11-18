// api/call_log/details.js
import api from '@/utils/axiosInstance'

export default function getCallLogDetails(id) {
  return api.get('call_log-details/', {
    params: { id }
  })
}
