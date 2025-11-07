import api from '@/utils/axiosInstance'

export const getUserRoleDetails = async (id) => {
  try {
    // ✅ Corrected endpoint
    const response = await api.get(`user_role-details/?id=${id}`)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching user role details:', error)
    throw error
  }
}
