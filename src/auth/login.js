import api from '@/utils/axiosInstance'

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('auth/login/', { email, password })

    if (response.data?.status === 'success') {
      const { access, refresh } = response.data.data

      // ✅ Save tokens securely
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)

        // ✅ Force sync before redirect
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return response.data
  } catch (error) {
    console.error('Login API Error:', error)
    throw error.response?.data || { message: 'Network Error' }
  }
}
