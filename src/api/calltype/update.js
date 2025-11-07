import api from '@/utils/axiosInstance'

export const updateCallType = async payload => {
  try {
    const response = await api.put(`calltype-update/?id=${payload.id}`, payload)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Call type updated successfully',
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to update call type'
      }
    }
  } catch (error) {
    console.error('❌ Update Call Type Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while updating call type'
    }
  }
}
