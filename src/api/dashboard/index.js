import api from '@/utils/axiosInstance'

export const getDashboardData = async () => {
  try {
    const res = await api.get('dashboard/')
    return res.data
  } catch (err) {
    console.error('Dashboard API Error:', err)
    return { status: 'failed', data: null }
  }
}
