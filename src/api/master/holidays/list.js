import api from '@/utils/axiosInstance'

export const getHolidaysList = async () => {
  try {
    const res = await api.get('holidays-list/')
    if (res?.data?.status === 'success') {
      return { success: true, data: res.data.data.results || [] }
    }
    return { success: false, message: res?.data?.message || 'Failed to fetch holidays' }
  } catch (error) {
    console.error('❌ Holidays List Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
