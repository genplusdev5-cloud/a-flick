import api from '@/utils/axiosInstance'

export const addUom = async payload => {
  try {
    const response = await api.post('uom-add/', payload)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'UOM added successfully',
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response?.data?.message || 'Failed to add UOM'
      }
    }
  } catch (error) {
    console.error('❌ Add UOM Error:', error)
    return {
      success: false,
      message:
        error?.response?.data?.message || 'Something went wrong while adding UOM'
    }
  }
}
