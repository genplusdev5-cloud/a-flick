import api from '@/utils/axiosInstance'

export const addSchedule = async data => {
  const res = await api.post('/attendance-schedule-add/', data)
  return res.data
}
