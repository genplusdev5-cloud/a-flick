import api from '@/utils/axiosInstance'

export const deleteLeaveType = async id => {
  // 👇 Backend expects ID in query params, not body
  const res = await api.patch(`leavetype-delete/?id=${id}`)
  return res.data
}
