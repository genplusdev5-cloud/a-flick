import api from '@/utils/axiosInstance'

export const getIndustryDetails = async id => {
  try {
    const res = await api.get(`industry-details/?id=${id}`)
    if (res?.data?.status === 'success') {
      return { success: true, data: res.data.data }
    }
    return { success: false, message: res?.data?.message || 'Failed to fetch industry details' }
  } catch (error) {
    console.error('❌ Industry Details Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
