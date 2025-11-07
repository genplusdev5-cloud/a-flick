import api from '@/utils/axiosInstance'

export const refreshUserRole = async () => {
  try {
    const response = await api.get('userrole-refresh/')
    return response.data
  } catch (error) {
    console.error('❌ Error refreshing user roles:', error)
    throw error
  }
}
