import api from '@/utils/axiosInstance'

export const getScheduleList = async params => {
  const response = await api.get('/attendance_request-list/', { params })
  return response.data.data // 👈 IMPORTANT: API returns: { message, status, data }
}
