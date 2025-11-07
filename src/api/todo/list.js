import api from '@/utils/axiosInstance'

export const getTodoList = async () => {
  try {
    const response = await api.get('todo-list/')
    if (response?.data?.status === 'success') {
      return { success: true, data: response.data.data?.results || [] }
    } else {
      return { success: false, message: response.data?.message || 'Failed to fetch todo list' }
    }
  } catch (error) {
    console.error('❌ Get Todo List Error:', error)
    return { success: false, message: 'Something went wrong' }
  }
}
