// src/api/nonPreschedule/list.js
import api from '@/utils/axiosInstance'

// If later backend supports ?page= / ?page_size= you can add params
export const getNonPrescheduleList = async () => {
  const res = await api.get('non-preschedule/')
  return res.data // { message, status, count, data: [...] }
}
