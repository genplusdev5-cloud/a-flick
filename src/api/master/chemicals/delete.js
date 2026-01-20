import api from '@/utils/axiosInstance'

export const deleteChemical = async id => {
  try {
    const response = await api.patch(`chemicals-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Chemical deleted successfully' }
    } else {
      return { success: false, message: response?.data?.message || 'Failed to delete chemical' }
    }
  } catch (error) {
    console.error('❌ Delete Chemical Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong while deleting' }
  }
}
