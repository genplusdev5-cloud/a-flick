import api from '@/utils/axiosInstance'

export const getCallTypeDetails = async id => {
  try {
    const response = await api.get(`calltype-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Call type details fetched successfully'
      }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to fetch call type details' }
    }
  } catch (error) {
    console.error('❌ Get Call Type Details Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while fetching details'
    }
  }
}
