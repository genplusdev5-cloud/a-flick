import api from '@/utils/axiosInstance'

export const deleteIncident = async id => {
  try {
    const response = await api.patch(`incident-delete/?id=${id}`)

    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Incident deleted successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to delete incident' }
    }
  } catch (error) {
    console.error('❌ Delete Incident Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
