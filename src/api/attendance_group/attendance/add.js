import api from '@/utils/axiosInstance'

export const addAttendance = async data => {
  const res = await api.post('attendance-add/', data)
  return res.data
}
