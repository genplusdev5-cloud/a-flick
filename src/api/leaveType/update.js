import api from '@/utils/axiosInstance'

export const updateLeaveType = async payload => {
  // 👇 Append the ID as query parameter
  const res = await api.put(`leavetype-update/?id=${payload.id}`, payload)
  return res.data
}
