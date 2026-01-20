import api from '@/utils/axiosInstance'

export const addCallType = async payload => {
  try {
    const response = await api.post('calltype-add/', payload)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Call type added successfully',
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to add call type'
      }
    }
  } catch (error) {
    console.error('❌ Add Call Type Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while adding call type'
    }
  }
}
