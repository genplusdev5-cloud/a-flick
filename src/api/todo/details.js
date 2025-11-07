import api from '@/utils/axiosInstance'

export const getTodoDetails = async id => {
  try {
    const response = await api.get(`todo-details/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch details' }
    }
  } catch (error) {
    console.error('❌ Get Todo Details Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
