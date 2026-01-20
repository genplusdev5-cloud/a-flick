import api from '@/utils/axiosInstance'

export const deleteTodo = async id => {
  try {
    const response = await api.patch(`todo-delete/?id=${id}`)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Todo deleted successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to delete Todo' }
    }
  } catch (error) {
    console.error('❌ Delete Todo Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
