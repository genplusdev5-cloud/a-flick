import api from '@/utils/axiosInstance'

export const deleteAttendance = async id => {
  return await api.patch(`attendance-delete/?id=${id}`)
}
