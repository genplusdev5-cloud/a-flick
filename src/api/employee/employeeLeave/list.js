import api from '@/utils/axiosInstance'

export const getEmployeeLeaveList = async (params = {}) => {
  const res = await api.get('employeeleave-list/', { params })
  return res.data
}

