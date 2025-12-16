import api from '@/utils/axiosInstance'

export const addChemical = async formData => {
  try {
    const response = await api.post('chemicals-add/', formData)

    if (response?.data?.status === 'success') {
      return {
        success: true,
        message: response.data.message || 'Chemical added successfully',
        data: response.data.data
      }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to add chemical' }
    }
  } catch (error) {
    console.error('❌ Add Chemical Error:', error)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while adding chemical'
    }
  }
}
