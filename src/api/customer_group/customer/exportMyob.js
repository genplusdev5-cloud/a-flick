import api from '@/utils/axiosInstance'

export const exportMyob = async payload => {
  const response = await api.post('/export-myob/', payload)
  return response.data
}
