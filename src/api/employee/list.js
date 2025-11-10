import api from '@/utils/axiosInstance'

export const getEmployeeList = async () => {
  const response = await api.get('employee-list/')
  return response.data.data // ✅ returns { count, next, results }
}
