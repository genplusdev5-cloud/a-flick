import api from '@/utils/axiosInstance'

export const deleteUom = async id => {
  try {
    if (!id) {
      return { success: false, message: 'UOM ID is missing' }
    }

    // ✅ Backend expects query parameter (?id=)
    const response = await api.patch(`uom-delete/?id=${id}`)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'UOM deleted successfully'
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to delete UOM'
      }
    }
  } catch (error) {
    console.error('❌ Delete UOM Error:', error)
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Something went wrong while deleting UOM'
    }
  }
}
