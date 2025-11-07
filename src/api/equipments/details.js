import api from '@/utils/axiosInstance'

export const getEquipmentDetails = async id => {
  try {
    const response = await api.get(`equipments-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch equipment details' }
    }
  } catch (error) {
    console.error('❌ Get Equipment Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
