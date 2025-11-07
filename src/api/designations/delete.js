import api from '@/utils/axiosInstance'

export const deleteDesignation = async id => {
  try {
    const response = await api.patch(`designation-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    }
    return { success: false, message: response.data?.message || 'Failed to delete designation' }
  } catch (error) {
    console.error('❌ Delete Designation Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
