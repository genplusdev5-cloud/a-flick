import api from '@/utils/axiosInstance'

// 📌 KVI Finder Report API
export const getKviFinderList = async () => {
  try {
    const res = await api.get('kvi-finder/')
    return res.data
  } catch (error) {
    console.error('Error fetching KVI Finder list:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'API error'
    }
  }
}
