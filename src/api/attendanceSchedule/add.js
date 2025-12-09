import api from '@/utils/axiosInstance'

export const addSchedule = async data => {
  const response = await api.post('/attendance-schedule/', data)
  return response.data
}
