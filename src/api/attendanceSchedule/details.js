import api from '@/utils/axiosInstance'

export const getScheduleDetails = async id => {
  const response = await api.get(`/attendance_request-details/?id=${id}`)
  return response.data
}
