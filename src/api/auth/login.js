import api from '@/utils/axiosInstance'
import { saveTokens } from '@/utils/tokenUtils'

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('auth/login/', { email, password })

    if (response.data?.status === 'success') {
      const { access, refresh, ...userData } = response.data.data

      // Save tokens
      saveTokens(access, refresh)

      // Save User Info (excluding tokens if they were mixed in, though usually they are separate)
      // Adjust structure if 'user' is a nested key, but traditionally it might be at root of data
      // If response.data.data has only access/refresh, then we need to look elsewhere?
      // Assuming response.data.data contains user fields like name, email, role_id based on common patterns here.

      // Safety check: if userData is empty, maybe user is nested?
      // Common pattern: data: { tokens: {...}, user: {...} } or flat.
      // Based on PermissionContext using `role_id` from ROOT of user_info, it implies flat or direct object.

      const userInfoToSave = userData.user || userData // Handle potential nesting

      localStorage.setItem('user_info', JSON.stringify(userInfoToSave))

      // Dispatch event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('user-info-update'))
        window.dispatchEvent(new Event('privilege-update')) // Force permission fetch
      }
    }

    return response.data
  } catch (error) {
    console.error('Login API Error:', error)
    throw error.response?.data || { message: 'Network Error' }
  }
}
