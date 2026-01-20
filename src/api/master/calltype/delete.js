import api from '@/utils/axiosInstance'

export const deleteCallType = async id => {
  try {
    const response = await api.patch(`calltype-delete/?id=${id}`)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Call type deleted successfully'
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to delete call type'
      }
    }
  } catch (error) {
    console.error('❌ Delete Call Type Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while deleting call type'
    }
  }
}
