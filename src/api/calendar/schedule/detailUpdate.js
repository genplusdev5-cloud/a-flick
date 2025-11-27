import api from '@/utils/axiosInstance'

export const updateScheduleDetails = async data => {
  const res = await api.patch('schedule-detailupdate/', data)
  return res.data
}
