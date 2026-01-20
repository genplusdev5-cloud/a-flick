import api from '@/utils/axiosInstance'

export const addIndustry = async payload => {
  try {
    const res = await api.post('industry-add/', payload)
    if (res?.data?.status === 'success') {
      return { success: true, message: res.data.message || 'Industry added successfully' }
    }
    return { success: false, message: res?.data?.message || 'Failed to add industry' }
  } catch (error) {
    console.error('❌ Add Industry Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
