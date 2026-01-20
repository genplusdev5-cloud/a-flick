import api from '@/utils/axiosInstance'

export const getKviFinderList = async (params = {}) => {
  try {
    const res = await api.get('kvi-finder/', { params })

    const response = res.data || {}

    return {
      status: 'success',
      results: response.results || [],
      count: response.count || 0,
      next: response.next,
      previous: response.previous
    }
  } catch (error) {
    console.error('KVI find error:', error)
    throw error
  }
}
