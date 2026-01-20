import api from '@/utils/axiosInstance'

export const getSiteRiskDetails = async id => {
  try {
    const response = await api.get(`siterisk-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch Site Risk details' }
    }
  } catch (error) {
    console.error('❌ Get Site Risk Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
