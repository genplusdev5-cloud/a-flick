import api from '@/utils/axiosInstance'

export const getEquipmentList = async () => {
  try {
    const response = await api.get('equipments-list/')
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch equipment list' }
    }
  } catch (error) {
    console.error('❌ Get Equipment List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
