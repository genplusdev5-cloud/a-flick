import api from '@/utils/axiosInstance'

export const updateSiteRisk = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Site Risk ID')
    const response = await api.put(`siterisk-update/?id=${payload.id}`, payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Site Risk updated successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to update Site Risk' }
    }
  } catch (error) {
    console.error('❌ Update Site Risk Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
