import api from '@/utils/axiosInstance'

export const addDepartment = async payload => {
  try {
    const response = await api.post('department-add/', payload)
    if (response?.data?.status === 'success') {
      return { success: true, message: response.data.message }
    } else {
      return { success: false, message: response.data?.message || 'Failed to add department' }
    }
  } catch (error) {
    console.error('❌ Add Department Error:', error)
    return { success: false, message: error?.response?.data?.message || 'Something went wrong' }
  }
}
