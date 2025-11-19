import api from '@/utils/axiosInstance'

export const loadTechnicians = async () => {
  const response = await api.get('load-technician/')
  return response.data?.data || []
}
