import api from '@/utils/axiosInstance'

export const generateScheduleApi = async payload => {
  const res = await api.post('schedule/', payload)
  return res.data
}
