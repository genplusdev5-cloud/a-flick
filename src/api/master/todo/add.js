import api from '@/utils/axiosInstance'

export const addTodo = async payload => {
  try {
    const response = await api.post('todo-add/', payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    } else {
      return { success: false, message: response.data?.message || 'Failed to add Todo' }
    }
  } catch (error) {
    console.error('❌ Add Todo Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
