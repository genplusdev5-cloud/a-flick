import api from '@/utils/axiosInstance'

// ✅ Update User Role API
export const updateUserRole = async (id, payload) => {
  try {
    if (!id) throw new Error('UserRole ID is required')

    const response = await api.put(`user_role-update/?id=${id}`, payload)
    return response.data
  } catch (error) {
    console.error('❌ Error updating UserRole:', error)
    throw error
  }
}
