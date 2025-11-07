import api from '@/utils/axiosInstance'

export const addEmployeeLeave = async payload => {
  const res = await api.post('employeeleave-add/', payload)
  return res.data
}
