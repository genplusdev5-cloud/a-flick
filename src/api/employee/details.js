import api from '@/utils/axiosInstance'

export const getEmployeeDetails = async id => {
  const response = await api.get(`employee-details/?id=${id}`)
  return response.data
}
