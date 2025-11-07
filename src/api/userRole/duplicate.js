import api from '@/utils/axiosInstance'

export const duplicateUserRole = async (id, newRoleName) => {
  if (!id) throw new Error('UserRole ID is required')
  if (!newRoleName) throw new Error('New role name is required')

  const response = await api.post('user_role-duplicate/', {
    id,
    new_role_name: newRoleName
  })

  return response.data
}
