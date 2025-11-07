import api from '@/utils/axiosInstance'

export const addEquipment = async payload => {
  try {
    const response = await api.post('equipments-add/', payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    } else {
      return { success: false, message: response.data?.message || 'Failed to add equipment' }
    }
  } catch (error) {
    console.error('❌ Add Equipment Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
