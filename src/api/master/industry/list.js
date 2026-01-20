import api from '@/utils/axiosInstance'

export const getIndustryList = async () => {
  try {
    const res = await api.get('industry-list/')
    if (res?.data?.status === 'success') {
      return { success: true, data: res.data.data.results || [] }
    }
    return { success: false, message: res?.data?.message || 'Failed to fetch industries' }
  } catch (error) {
    console.error('❌ Industry List Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
