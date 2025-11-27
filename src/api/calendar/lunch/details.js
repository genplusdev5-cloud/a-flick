import api from '@/utils/axiosInstance'

export const getEmployeeLunchDetails = async id => {
  const res = await api.get('employeelunch-details/', {
    params: { id }
  })
  return res.data
}
