import api from '@/utils/axiosInstance'

export const deleteAttendance = async id => {
  const res = await api.patch('attendance-delete/', { id })
  return res.data
}
