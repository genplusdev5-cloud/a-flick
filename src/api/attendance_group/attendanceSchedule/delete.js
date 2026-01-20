import api from '@/utils/axiosInstance'

export const deleteSchedule = async id => {
  const res = await api.patch(`/attendance-schedule-delete/?id=${id}`)
  return res.data
}
