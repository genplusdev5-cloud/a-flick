import api from '@/utils/axiosInstance'

export const addUserRole = async (payload) => {
  try {
    const response = await api.post('user_role-add/', payload)

    return response.data
  } catch (error) {
    console.error('❌ Error adding user role:', error)
    throw error
  }
}
