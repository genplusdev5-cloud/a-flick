import api from '@/utils/axiosInstance'

export const updateTodo = async payload => {
  try {
    if (!payload.id) throw new Error('Missing Todo ID')
    const response = await api.put(`todo-update/?id=${payload.id}`, payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message || 'Todo updated successfully' }
    } else {
      return { success: false, message: response.data?.message || 'Failed to update Todo' }
    }
  } catch (error) {
    console.error('❌ Update Todo Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
