import api from '@/utils/axiosInstance'

export const deleteSiteRisk = async id => {
  try {
    const response = await api.patch(`siterisk-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Site Risk deleted successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to delete Site Risk' }
    }
  } catch (error) {
    console.error('❌ Delete Site Risk Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
