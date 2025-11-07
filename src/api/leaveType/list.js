import api from '@/utils/axiosInstance'

export const getLeaveTypeList = async () => {
  const res = await api.get('leavetype-list/')
  return res.data
}
