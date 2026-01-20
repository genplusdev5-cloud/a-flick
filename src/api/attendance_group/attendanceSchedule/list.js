import api from '@/utils/axiosInstance'

export const getScheduleList = async params => {
  const res = await api.get('/attendance_request-list/', { params })
  return res.data.data // { message, status, data }
}
