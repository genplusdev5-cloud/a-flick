import api from '@/utils/axiosInstance'

export const addSiteRisk = async payload => {
  try {
    const response = await api.post('siterisk-add/', payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    } else {
      return { success: false, message: response.data?.message || 'Failed to add Site Risk' }
    }
  } catch (error) {
    console.error('❌ Add Site Risk Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
