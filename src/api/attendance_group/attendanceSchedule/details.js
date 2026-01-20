import api from '@/utils/axiosInstance'

export const getScheduleDetails = async id => {
  const res = await api.get(`/attendance-schedule-details/?id=${id}`)
  return res.data
}
