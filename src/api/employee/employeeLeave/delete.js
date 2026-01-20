import api from '@/utils/axiosInstance'

export const deleteEmployeeLeave = async id => {
  const res = await api.patch(`employeeleave-delete/?id=${id}`)
  return res.data
}
