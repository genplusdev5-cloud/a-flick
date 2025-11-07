import api from '@/utils/axiosInstance'

export const getUserPrivilegeList = async roleId => {
  try {
    const response = await api.get(`user_privilege-list/?role_id=${roleId}&page=1&page_size=1000`)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching user privilege list:', error)
    throw error
  }
}
