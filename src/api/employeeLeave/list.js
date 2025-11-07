import api from '@/utils/axiosInstance'

export const getEmployeeLeaveList = async () => {
  const res = await api.get('employeeleave-list/')
  return res.data
}
