import api from '@/utils/axiosInstance'

export const getCallTypeList = async () => {
  try {
    const response = await api.get('calltype-list/')

    if (response?.data?.status === 'success') {
      const data = response.data.data?.results || []
      return {
        success: true,
        data,
        message: response.data.message || 'Call types fetched successfully'
      }
    } else {
      return { success: false, data: [], message: response?.data?.message || 'Failed to fetch call types' }
    }
  } catch (error) {
    console.error('❌ Get Call Type List Error:', error)
    return {
      success: false,
      data: [],
      message: error?.response?.data?.message || 'Something went wrong while fetching call types'
    }
  }
}
