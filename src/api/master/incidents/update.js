import api from '@/utils/axiosInstance'

export const updateIncident = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Incident ID')

    const response = await api.put(`incident-update/?id=${payload.id}`, payload)

    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Incident updated successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to update incident' }
    }
  } catch (error) {
    console.error('❌ Update Incident Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
