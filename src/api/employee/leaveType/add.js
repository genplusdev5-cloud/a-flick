import api from '@/utils/axiosInstance'

export const addLeaveType = async payload => {
  const res = await api.post('leavetype-add/', payload)
  return res.data
}
