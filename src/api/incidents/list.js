import api from '@/utils/axiosInstance'

export const getIncidentList = async () => {
  try {
    const response = await api.get('incident-list/')

    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch incident list' }
    }
  } catch (error) {
    console.error('❌ Get Incident List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
