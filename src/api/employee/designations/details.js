import api from '@/utils/axiosInstance'

export const getDesignationDetails = async id => {
  try {
    const response = await api.get(`designation-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    }
    return { success: false, message: response.data?.message || 'Failed to fetch designation details' }
  } catch (error) {
    console.error('❌ Get Designation Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
