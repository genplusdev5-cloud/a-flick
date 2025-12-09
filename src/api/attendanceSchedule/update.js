import api from '@/utils/axiosInstance'

export const updateSchedule = async (id, data) => {
  const response = await api.put(`/attendance_request-update/?id=${id}`, data)
  return response.data
}
