import api from '@/utils/axiosInstance'

export const deleteSchedule = async id => {
  const response = await api.patch(`/attendance_request-delete/?id=${id}`)
  return response.data
}
