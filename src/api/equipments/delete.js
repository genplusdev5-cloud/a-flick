import api from '@/utils/axiosInstance'

export const deleteEquipment = async id => {
  try {
    const response = await api.patch(`equipments-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Equipment deleted successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to delete equipment' }
    }
  } catch (error) {
    console.error('❌ Delete Equipment Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
