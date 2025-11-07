import api from '@/utils/axiosInstance'

export const addHoliday = async payload => {
  try {
    console.log('🛰 Sending Holiday Payload:', payload)
    const res = await api.post('holidays-add/', payload)
    if (res?.data?.status === 'success') {
      return { success: true, message: res.data.message || 'Holiday added successfully' }
    }
    return { success: false, message: res?.data?.message || 'Failed to add holiday' }
  } catch (error) {
    console.error('❌ Add Holiday Error:', error.response?.status, error.response?.data)
    return {
      success: false,
      message: error?.response?.data?.message || 'Something went wrong while adding holiday'
    }
  }
}
