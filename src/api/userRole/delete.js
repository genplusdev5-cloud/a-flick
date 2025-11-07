import api from '@/utils/axiosInstance'

export const deleteUserRole = async (id) => {
  if (!id) throw new Error('UserRole ID is required')
  const response = await api.patch(`user_role-delete/?id=${id}`)
  return response.data
}
