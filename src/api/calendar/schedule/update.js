import api from '@/utils/axiosInstance'

export const updateSchedule = async data => {
  const res = await api.patch('schedule-update/', data)
  return res.data
}
