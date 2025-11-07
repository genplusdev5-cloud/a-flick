import api from '@/utils/axiosInstance'

export const getIncidentDetails = async id => {
  try {
    const response = await api.get(`incident-details/?id=${id}`)

    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch details' }
    }
  } catch (error) {
    console.error('❌ Get Incident Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
