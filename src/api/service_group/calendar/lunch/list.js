import api from '@/utils/axiosInstance'

export const getEmployeeLunchList = async params => {
  // supports filters: employee_id, date, etc.
  const res = await api.get('employeelunch-list/', { params })

  return res.data
}
