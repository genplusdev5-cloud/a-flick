import api from '@/utils/axiosInstance'

export const updateEmployee = async payload => {
  const response = await api.put('employee-update/', payload)
  return response.data
}
