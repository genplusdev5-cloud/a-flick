import api from '@/utils/axiosInstance'

export const updateChemical = async (id, payload) => {
  try {
    // Backend expects id from query param
    const response = await api.put(`chemicals-update/?id=${id}`, payload)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Chemical updated successfully',
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to update chemical'
      }
    }
  } catch (error) {
    console.error('❌ Update Chemical Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while updating chemical'
    }
  }
}
