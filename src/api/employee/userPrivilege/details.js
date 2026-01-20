import api from '@/utils/axiosInstance'

export const getUserPrivilegeDetails = async (id) => {
  try {
    const response = await api.get(`user_privilege-details/?id=${id}`)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching user privilege details:', error)
    throw error
  }
}
