import api from '@/utils/axiosInstance'

export const deleteEmployeeLunch = async id => {
  const res = await api.patch('employeelunch-delete/', null, {
    params: { id }
  })
  return res.data
}
