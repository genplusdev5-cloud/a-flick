import api from '@/utils/axiosInstance'

/**
 * Attempts to blacklist the refresh token (DRF SimpleJWT).
 * Gracefully ignores 404/405 (endpoint missing) so UI can still log out.
 */
export const logoutUser = async () => {
  try {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

    // If we have a refresh token, try DRF SimpleJWT blacklist endpoint
    if (refresh) {
      await api.post('auth/token/blacklist/', { refresh })
    }

    // If no refresh token, nothing to blacklist; still consider success
    return { status: 'success' }
  } catch (err) {
    const code = err?.response?.status

    // Endpoint missing or method not allowed: safe to skip server logout
    if (code === 404 || code === 405) {
      return { status: 'skipped' }
    }

    // Any other error: log and still let UI proceed to clear tokens/redirect
    console.error('Logout API error:', err)
    return { status: 'error', message: 'Server logout failed; proceeding locally.' }
  }
}
