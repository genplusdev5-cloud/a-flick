import api from '@/utils/axiosInstance'

export const getRICDropdowns = async (params = {}) => {
  try {
    const response = await api.get('/report-dropdown/', { params })
    return response.data
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}
