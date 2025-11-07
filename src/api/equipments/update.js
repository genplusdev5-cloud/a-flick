import api from '@/utils/axiosInstance'

export const updateEquipment = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Equipment ID')
    const response = await api.put(`equipments-update/?id=${payload.id}`, payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Equipment updated successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to update equipment' }
    }
  } catch (error) {
    console.error('❌ Update Equipment Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
