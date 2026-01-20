import api from '@/utils/axiosInstance'

export const updateAttendance = async (id, data) => {
  const res = await api.put(`attendance-update/?id=${id}`, data)
  return res.data
}
