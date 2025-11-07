import api from '@/utils/axiosInstance'

export const getSiteRiskList = async () => {
  try {
    const response = await api.get('siterisk-list/')
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch Site Risk list' }
    }
  } catch (error) {
    console.error('❌ Get Site Risk List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
