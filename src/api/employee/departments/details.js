import api from '@/utils/axiosInstance'

export const getDepartmentDetails = async id => {
  try {
    const response = await api.get(`department-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch department details' }
    }
  } catch (error) {
    console.error('❌ Get Department Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
