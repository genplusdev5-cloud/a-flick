// employee.js
import api from '@/utils/axiosInstance'

export const getEmployeeDetails = async (id, config = {}) => {
  const response = await api.get(`/employee-details/?id=${id}`, config)
  return response.data
}
