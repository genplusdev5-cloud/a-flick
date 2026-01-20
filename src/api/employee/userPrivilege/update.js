import api from '@/utils/axiosInstance'

export const updateUserPrivilege = async (roleId, privileges) => {
  try {
    console.log('🔹 Sending privileges for role_id:', roleId)
    console.log('🔹 Payload:', privileges)

    const response = await api.post('user_privilege-update/', {
      role_id: roleId,
      privileges
    })

    return response.data
  } catch (error) {
    console.error('❌ Error updating user privileges:', error)
    throw error
  }
}

