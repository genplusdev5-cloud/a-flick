import api from '@/utils/axiosInstance'
import { saveTokens } from '@/utils/tokenUtils'

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('auth/login/', { email, password })

    if (response.data?.status === 'success') {
      const { access, refresh } = response.data.data
      saveTokens(access, refresh)
    }

    return response.data
  } catch (error) {
    console.error('Login API Error:', error)
    throw error.response?.data || { message: 'Network Error' }
  }
}
