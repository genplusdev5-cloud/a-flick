import api from '@/utils/axiosInstance'

export const getUserRoleList = async () => {
  try {
    const response = await api.get(`user_role-list/`)

    return response.data
  } catch (error) {
    console.error('❌ Error fetching user roles:', error)
    throw error
  }
}
