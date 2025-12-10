import api from '@/utils/axiosInstance'

export const updateSchedule = async (id, data) => {
  const res = await api.put(`/attendance-schedule-update/?id=${id}`, data)
  return res.data
}
