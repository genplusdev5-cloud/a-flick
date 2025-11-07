import api from '@/utils/axiosInstance'

export const updateLeaveType = async payload => {
  if (!payload?.id) {
    throw new Error('❌ updateLeaveType called without a valid ID')
  }

  const res = await api.put(`leavetype-update/?id=${payload.id}`, payload)
  return res.data
}
