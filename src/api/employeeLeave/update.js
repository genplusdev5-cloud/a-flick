import api from '@/utils/axiosInstance'

export const updateEmployeeLeave = async payload => {
  const res = await api.put(`employeeleave-update/?id=${payload.id}`, payload)
  return res.data
}
