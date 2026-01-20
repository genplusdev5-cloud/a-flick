import api from '@/utils/axiosInstance'

export const addDesignation = async payload => {
  try {
    const response = await api.post('designation-add/', payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    }
    return { success: false, message: response.data?.message || 'Failed to add designation' }
  } catch (error) {
    console.error('❌ Add Designation Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
