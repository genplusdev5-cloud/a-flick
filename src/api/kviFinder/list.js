import api from '@/utils/axiosInstance'

export const getKviFinderList = async (payload = {}) => {
  try {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })

    const res = await api.post('kvi-finder/', formData)

    const response = res.data || {}

    return {
      status: response.status,
      message: response.message,
      results: response.data?.data || [], // 🔥 FIX
      count: (response.data?.data || []).length
    }
  } catch (error) {
    console.error('KVI find error:', error)
    return {
      status: 'failed',
      message: error.response?.data?.message || 'API error'
    }
  }
}
