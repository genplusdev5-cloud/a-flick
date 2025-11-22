import api from '@/utils/axiosInstance'

// 📌 Productivity Report API
export const getProductivityList = async () => {
  try {
    const res = await api.get('report-productivity/')
    return res.data
  } catch (error) {
    console.error('Error fetching productivity report:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'API error'
    }
  }
}
