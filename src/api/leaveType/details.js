import api from '@/utils/axiosInstance'

export const getLeaveTypeDetails = async id => {
  const res = await api.get(`leavetype-details?id=${id}`)
  return res.data
}
