import api from '@/utils/axiosInstance'

export const updateDesignation = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Designation ID')
    const response = await api.put(`designation-update/?id=${payload.id}`, payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    }
    return { success: false, message: response.data?.message || 'Failed to update designation' }
  } catch (error) {
    console.error('❌ Update Designation Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
