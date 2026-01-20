import api from '@/utils/axiosInstance'

export const updateUom = async payload => {
  try {
    // ✅ Pass id in query params, as required by backend
    const response = await api.put(`uom-update/?id=${payload.id}`, payload)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'UOM updated successfully',
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to update UOM'
      }
    }
  } catch (error) {
    console.error('❌ Update UOM Error:', error)
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Something went wrong while updating UOM'
    }
  }
}
